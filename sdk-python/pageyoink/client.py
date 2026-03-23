"""PageYoink API client."""

from __future__ import annotations

from typing import Any, Union
from urllib.parse import urlencode

import httpx


class PageYoinkError(Exception):
    """Error from the PageYoink API."""

    def __init__(self, message: str, status_code: int) -> None:
        super().__init__(message)
        self.status_code = status_code


class PageYoink:
    """Client for the PageYoink screenshot and PDF API.

    Usage::

        from pageyoink import PageYoink

        client = PageYoink(api_key="your-key")
        png = client.screenshot("https://example.com", clean=True, block_ads="stealth")
        with open("screenshot.png", "wb") as f:
            f.write(png)
    """

    def __init__(
        self,
        api_key: str,
        base_url: str = "https://api.pageyoink.dev",
        timeout: float = 60.0,
    ) -> None:
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self._client = httpx.Client(
            timeout=timeout,
            headers={"x-api-key": api_key},
        )

    def close(self) -> None:
        """Close the underlying HTTP client."""
        self._client.close()

    def __enter__(self) -> PageYoink:
        return self

    def __exit__(self, *args: Any) -> None:
        self.close()

    # -- Screenshot --

    def screenshot(
        self,
        url: str,
        *,
        format: str = "png",
        quality: int | None = None,
        full_page: bool = False,
        width: int | None = None,
        height: int | None = None,
        viewports: int | None = None,
        device_scale_factor: float | None = None,
        clean: bool = False,
        smart_wait: bool = False,
        block_ads: Union[bool, str, None] = None,
        max_scroll: int | None = None,
        css: str | None = None,
        js: str | None = None,
        user_agent: str | None = None,
        selector: str | None = None,
        transparent: bool = False,
        click: str | None = None,
        click_count: int | None = None,
        fonts: list[str] | None = None,
        ttl: int | None = None,
        fresh: bool = False,
        timeout: int | None = None,
    ) -> bytes:
        """Take a screenshot of a URL. Returns image bytes.

        Args:
            block_ads: True for network blocking, "stealth" for post-load visual hiding,
                       None/False to disable.
        """
        params: dict[str, Any] = {"url": url, "format": format}
        if quality is not None:
            params["quality"] = quality
        if full_page:
            params["full_page"] = "true"
        if width is not None:
            params["width"] = width
        if height is not None:
            params["height"] = height
        if viewports is not None:
            params["viewports"] = viewports
        if device_scale_factor is not None:
            params["device_scale_factor"] = device_scale_factor
        if clean:
            params["clean"] = "true"
        if smart_wait:
            params["smart_wait"] = "true"
        if block_ads:
            params["block_ads"] = "stealth" if block_ads == "stealth" else "true"
        if max_scroll is not None:
            params["max_scroll"] = max_scroll
        if css:
            params["css"] = css
        if js:
            params["js"] = js
        if user_agent:
            params["user_agent"] = user_agent
        if selector:
            params["selector"] = selector
        if transparent:
            params["transparent"] = "true"
        if click:
            params["click"] = click
        if click_count is not None:
            params["click_count"] = click_count
        if ttl is not None:
            params["ttl"] = ttl
        if fresh:
            params["fresh"] = "true"
        if timeout is not None:
            params["timeout"] = timeout

        return self._get(f"/v1/screenshot?{urlencode(params)}")

    # -- PDF --

    def pdf_from_url(
        self,
        url: str,
        *,
        format: str = "A4",
        landscape: bool = False,
        clean: bool = False,
        smart_wait: bool = False,
        block_ads: Union[bool, str, None] = None,
        max_scroll: int | None = None,
        css: str | None = None,
        js: str | None = None,
        user_agent: str | None = None,
        ttl: int | None = None,
        fresh: bool = False,
        timeout: int | None = None,
    ) -> bytes:
        """Generate a PDF from a URL. Returns PDF bytes."""
        params: dict[str, Any] = {"url": url, "format": format}
        if landscape:
            params["landscape"] = "true"
        if clean:
            params["clean"] = "true"
        if smart_wait:
            params["smart_wait"] = "true"
        if block_ads:
            params["block_ads"] = "stealth" if block_ads == "stealth" else "true"
        if max_scroll is not None:
            params["max_scroll"] = max_scroll
        if css:
            params["css"] = css
        if js:
            params["js"] = js
        if user_agent:
            params["user_agent"] = user_agent
        if ttl is not None:
            params["ttl"] = ttl
        if fresh:
            params["fresh"] = "true"
        if timeout is not None:
            params["timeout"] = timeout

        return self._get(f"/v1/pdf?{urlencode(params)}")

    def pdf_from_html(
        self,
        html: str,
        *,
        format: str = "A4",
        landscape: bool = False,
        print_background: bool = True,
        margin: dict[str, str] | None = None,
        clean: bool = False,
        smart_wait: bool = False,
        block_ads: Union[bool, str, None] = None,
        max_scroll: int | None = None,
        css: str | None = None,
        js: str | None = None,
        headers: dict[str, str] | None = None,
        cookies: list[dict[str, str]] | None = None,
        user_agent: str | None = None,
        proxy: str | None = None,
        header_template: str | None = None,
        footer_template: str | None = None,
        page_ranges: str | None = None,
        watermark: dict[str, Any] | None = None,
        geolocation: dict[str, float] | None = None,
        timezone: str | None = None,
        timeout: int | None = None,
    ) -> bytes:
        """Generate a PDF from HTML with full options. Returns PDF bytes."""
        body: dict[str, Any] = {"html": html, "format": format}
        if landscape:
            body["landscape"] = True
        if not print_background:
            body["printBackground"] = False
        if margin:
            body["margin"] = margin
        if clean:
            body["clean"] = True
        if smart_wait:
            body["smartWait"] = True
        if block_ads:
            body["blockAds"] = "stealth" if block_ads == "stealth" else True
        if max_scroll is not None:
            body["maxScroll"] = max_scroll
        if css:
            body["css"] = css
        if js:
            body["js"] = js
        if headers:
            body["headers"] = headers
        if cookies:
            body["cookies"] = cookies
        if user_agent:
            body["userAgent"] = user_agent
        if proxy:
            body["proxy"] = proxy
        if header_template:
            body["headerTemplate"] = header_template
            body["displayHeaderFooter"] = True
        if footer_template:
            body["footerTemplate"] = footer_template
            body["displayHeaderFooter"] = True
        if page_ranges:
            body["pageRanges"] = page_ranges
        if watermark:
            body["watermark"] = watermark
        if geolocation:
            body["geolocation"] = geolocation
        if timezone:
            body["timezone"] = timezone
        if timeout is not None:
            body["timeout"] = timeout

        return self._post("/v1/pdf", body)

    # -- Diff --

    def diff(
        self,
        url1: str,
        url2: str,
        *,
        width: int | None = None,
        height: int | None = None,
        full_page: bool = False,
        clean: bool = False,
        block_ads: Union[bool, str, None] = None,
        threshold: float | None = None,
        format: str = "json",
    ) -> dict[str, Any] | bytes:
        """Compare two URLs visually. Returns diff stats (json) or diff image (image)."""
        body: dict[str, Any] = {"url1": url1, "url2": url2, "format": format}
        if width is not None:
            body["width"] = width
        if height is not None:
            body["height"] = height
        if full_page:
            body["fullPage"] = True
        if clean:
            body["clean"] = True
        if block_ads:
            body["blockAds"] = "stealth" if block_ads == "stealth" else True
        if threshold is not None:
            body["threshold"] = threshold

        if format == "image":
            return self._post("/v1/diff", body)
        return self._post_json("/v1/diff", body)

    # -- Batch --

    def batch(
        self,
        items: list[dict[str, Any]],
        *,
        webhook: str | None = None,
    ) -> dict[str, Any]:
        """Submit a batch of URLs for processing. Returns job info."""
        body: dict[str, Any] = {"items": items}
        if webhook:
            body["webhook"] = webhook

        return self._post_json("/v1/batch", body)

    def batch_status(self, job_id: str) -> dict[str, Any]:
        """Check the status of a batch job."""
        resp = self._client.get(f"{self.base_url}/v1/batch/{job_id}")
        if not resp.is_success:
            raise PageYoinkError(resp.text, resp.status_code)
        return resp.json()

    # -- Usage --

    def usage(self, days: int = 30) -> dict[str, Any]:
        """Get usage statistics for the current API key."""
        resp = self._client.get(f"{self.base_url}/v1/usage?days={days}")
        if not resp.is_success:
            raise PageYoinkError(resp.text, resp.status_code)
        return resp.json()

    # -- Internal --

    def _get(self, path: str) -> bytes:
        resp = self._client.get(f"{self.base_url}{path}")
        if not resp.is_success:
            raise PageYoinkError(resp.text, resp.status_code)
        return resp.content

    def _post(self, path: str, body: dict[str, Any]) -> bytes:
        resp = self._client.post(
            f"{self.base_url}{path}",
            json=body,
        )
        if not resp.is_success:
            raise PageYoinkError(resp.text, resp.status_code)
        return resp.content

    def _post_json(self, path: str, body: dict[str, Any]) -> dict[str, Any]:
        resp = self._client.post(
            f"{self.base_url}{path}",
            json=body,
        )
        if not resp.is_success:
            raise PageYoinkError(resp.text, resp.status_code)
        return resp.json()
