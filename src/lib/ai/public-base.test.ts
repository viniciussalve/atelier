import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { publicBase } from "./public-base.ts";

const PORT = "/hds-abc-8080-x";

const base = (
  url: string,
  headers: Record<string, string> = {},
  extra: { linkPrefix?: string | null; configured?: string } = {},
) => publicBase({ url, headers: new Headers(headers), ...extra });

describe("publicBase", () => {
  it("is the request's own origin without proxy headers", () => {
    assert.equal(base("http://localhost:8092/llms.txt"), "http://localhost:8092");
  });

  it("follows the first proxy in X-Forwarded-Host and X-Forwarded-Proto", () => {
    assert.equal(
      base("http://10.0.0.5:8080/llms.txt", {
        "x-forwarded-host": "Atelier.App, interno:8080",
        "x-forwarded-proto": "HTTPS, http",
      }),
      "https://atelier.app",
    );
    assert.equal(
      base("http://10.0.0.5:8080/", { "x-forwarded-host": "atelier.app:8443" }),
      "http://atelier.app:8443",
    );
  });

  it("ignores a forwarded host that is not a host and port", () => {
    for (const host of [
      "evil.example/?adicionar=fonte:x",
      "user@evil.example",
      "evil example",
      "evil.example:99999",
      "evil.example:",
      "evil.example\\x",
      "",
    ]) {
      assert.equal(
        base("http://localhost:8092/", { "x-forwarded-host": host }),
        "http://localhost:8092",
        JSON.stringify(host),
      );
    }
  });

  it("ignores a forwarded proto other than http and https", () => {
    for (const proto of ["javascript", "ftp", "https://evil.example", "http:"]) {
      assert.equal(
        base("http://localhost:8092/", { "x-forwarded-proto": proto, "x-forwarded-host": "a.b" }),
        "http://a.b",
        proto,
      );
    }
  });

  it("uses PUBLIC_BASE_URL over any header", () => {
    const headers = { "x-forwarded-host": "evil.example", "x-forwarded-proto": "http" };
    assert.equal(
      base("http://localhost:8092/", headers, { configured: "https://atelier.app/" }),
      "https://atelier.app",
    );
    assert.equal(
      base("http://localhost:8092/", headers, { configured: " https://exemplo.com/atelier/ " }),
      "https://exemplo.com/atelier",
    );
  });

  it("ignores a PUBLIC_BASE_URL that is not an http(s) URL", () => {
    for (const configured of ["atelier.app", "ftp://atelier.app", "", "   "]) {
      assert.equal(
        base("http://localhost:8092/", {}, { configured }),
        "http://localhost:8092",
        configured,
      );
    }
  });
});

describe("publicBase on path-based previews", () => {
  const preview = { "x-forwarded-host": "preview.grok.mil", "x-forwarded-proto": "https" };

  it("adds the port prefix from X-Forwarded-Prefix", () => {
    assert.equal(
      base("http://localhost:8080/llms.txt", { ...preview, "x-forwarded-prefix": PORT }),
      `https://preview.grok.mil${PORT}`,
    );
    assert.equal(
      base("http://localhost:8080/", { ...preview, "x-forwarded-prefix": `${PORT}/` }),
      `https://preview.grok.mil${PORT}`,
    );
  });

  it("adds the port prefix the Link para IA carries", () => {
    assert.equal(
      base("http://localhost:8080/ia", preview, { linkPrefix: PORT }),
      `https://preview.grok.mil${PORT}`,
    );
  });

  it("ignores a prefix on any other host", () => {
    assert.equal(
      base("http://localhost:8092/llms.txt", { "x-forwarded-prefix": PORT }),
      "http://localhost:8092",
    );
    assert.equal(
      base("http://localhost:8092/ia", { "x-forwarded-host": "atelier.app" }, { linkPrefix: PORT }),
      "http://atelier.app",
    );
  });

  it("ignores a prefix that is not exactly a port id", () => {
    for (const prefix of [
      "/evil",
      `${PORT}/evil`,
      `${PORT}/../evil`,
      "/hds-abc-web-x",
      `//evil.example${PORT}`,
      `${PORT}?x=1`,
    ]) {
      assert.equal(
        base("http://localhost:8080/", { ...preview, "x-forwarded-prefix": prefix }),
        "https://preview.grok.mil",
        prefix,
      );
      assert.equal(
        base("http://localhost:8080/ia", preview, { linkPrefix: prefix }),
        "https://preview.grok.mil",
        prefix,
      );
    }
  });

  it("keeps PUBLIC_BASE_URL whole, prefix or not", () => {
    assert.equal(
      base(
        "http://localhost:8080/ia",
        { ...preview, "x-forwarded-prefix": PORT },
        { linkPrefix: PORT, configured: "https://atelier.app" },
      ),
      "https://atelier.app",
    );
  });
});
