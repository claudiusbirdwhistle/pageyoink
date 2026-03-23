// Package pageyoink provides a Go client for the PageYoink screenshot and PDF API.
package pageyoink

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"time"
)

// Client is a PageYoink API client.
type Client struct {
	APIKey  string
	BaseURL string
	HTTP    *http.Client
}

// New creates a new PageYoink client.
func New(apiKey string) *Client {
	return &Client{
		APIKey:  apiKey,
		BaseURL: "https://api.pageyoink.dev",
		HTTP: &http.Client{
			Timeout: 60 * time.Second,
		},
	}
}

// ScreenshotOptions configures a screenshot request.
type ScreenshotOptions struct {
	URL               string
	Format            string  // "png" or "jpeg"
	Quality           int
	FullPage          bool
	Width             int
	Height            int
	Viewports         int     // Number of viewport heights to capture
	DeviceScaleFactor float64
	Clean             bool
	SmartWait         bool
	BlockAds          string  // "true", "stealth", or "" (disabled)
	MaxScroll         int
	CSS               string
	JS                string
	UserAgent         string
	Selector          string
	Transparent       bool
	Click             string
	ClickCount        int
	TTL               int
	Fresh             bool
	Timeout           int
}

// Screenshot captures a URL and returns the image bytes.
func (c *Client) Screenshot(opts ScreenshotOptions) ([]byte, error) {
	params := url.Values{}
	params.Set("url", opts.URL)
	if opts.Format != "" {
		params.Set("format", opts.Format)
	}
	if opts.Quality > 0 {
		params.Set("quality", strconv.Itoa(opts.Quality))
	}
	if opts.FullPage {
		params.Set("full_page", "true")
	}
	if opts.Width > 0 {
		params.Set("width", strconv.Itoa(opts.Width))
	}
	if opts.Height > 0 {
		params.Set("height", strconv.Itoa(opts.Height))
	}
	if opts.Viewports > 0 {
		params.Set("viewports", strconv.Itoa(opts.Viewports))
	}
	if opts.DeviceScaleFactor > 0 {
		params.Set("device_scale_factor", strconv.FormatFloat(opts.DeviceScaleFactor, 'f', -1, 64))
	}
	if opts.Clean {
		params.Set("clean", "true")
	}
	if opts.SmartWait {
		params.Set("smart_wait", "true")
	}
	if opts.BlockAds != "" {
		params.Set("block_ads", opts.BlockAds)
	}
	if opts.MaxScroll > 0 {
		params.Set("max_scroll", strconv.Itoa(opts.MaxScroll))
	}
	if opts.CSS != "" {
		params.Set("css", opts.CSS)
	}
	if opts.JS != "" {
		params.Set("js", opts.JS)
	}
	if opts.UserAgent != "" {
		params.Set("user_agent", opts.UserAgent)
	}
	if opts.Selector != "" {
		params.Set("selector", opts.Selector)
	}
	if opts.Transparent {
		params.Set("transparent", "true")
	}
	if opts.Click != "" {
		params.Set("click", opts.Click)
	}
	if opts.ClickCount > 0 {
		params.Set("click_count", strconv.Itoa(opts.ClickCount))
	}
	if opts.TTL > 0 {
		params.Set("ttl", strconv.Itoa(opts.TTL))
	}
	if opts.Fresh {
		params.Set("fresh", "true")
	}
	if opts.Timeout > 0 {
		params.Set("timeout", strconv.Itoa(opts.Timeout))
	}

	return c.get("/v1/screenshot?" + params.Encode())
}

// PDFFromURL generates a PDF from a URL.
func (c *Client) PDFFromURL(targetURL string, opts ...PdfURLOption) ([]byte, error) {
	params := url.Values{}
	params.Set("url", targetURL)
	for _, opt := range opts {
		opt(params)
	}
	return c.get("/v1/pdf?" + params.Encode())
}

// PdfURLOption is a functional option for PDFFromURL.
type PdfURLOption func(url.Values)

// WithFormat sets the PDF page format.
func WithFormat(f string) PdfURLOption { return func(v url.Values) { v.Set("format", f) } }

// WithLandscape enables landscape mode.
func WithLandscape() PdfURLOption { return func(v url.Values) { v.Set("landscape", "true") } }

// WithClean enables clean mode.
func WithClean() PdfURLOption { return func(v url.Values) { v.Set("clean", "true") } }

// WithBlockAds sets the ad blocking mode ("true" or "stealth").
func WithBlockAds(mode string) PdfURLOption { return func(v url.Values) { v.Set("block_ads", mode) } }

// WithScale sets the PDF zoom/scale factor (0.1 to 2.0).
func WithScale(s float64) PdfURLOption {
	return func(v url.Values) { v.Set("scale", strconv.FormatFloat(s, 'f', -1, 64)) }
}

// WithMaxPages limits the output PDF to N pages.
func WithMaxPages(n int) PdfURLOption {
	return func(v url.Values) { v.Set("max_pages", strconv.Itoa(n)) }
}

// PDFRequest is the JSON body for POST /v1/pdf.
type PDFRequest struct {
	HTML                string            `json:"html,omitempty"`
	URL                 string            `json:"url,omitempty"`
	Format              string            `json:"format,omitempty"`
	Landscape           bool              `json:"landscape,omitempty"`
	PrintBackground     *bool             `json:"printBackground,omitempty"`
	Margin              map[string]string `json:"margin,omitempty"`
	Clean               bool              `json:"clean,omitempty"`
	SmartWait           bool              `json:"smartWait,omitempty"`
	BlockAds            interface{}       `json:"blockAds,omitempty"` // bool or "stealth"
	MaxScroll           int               `json:"maxScroll,omitempty"`
	CSS                 string            `json:"css,omitempty"`
	JS                  string            `json:"js,omitempty"`
	Headers             map[string]string `json:"headers,omitempty"`
	Cookies             []Cookie          `json:"cookies,omitempty"`
	UserAgent           string            `json:"userAgent,omitempty"`
	Proxy               string            `json:"proxy,omitempty"`
	HeaderTemplate      string            `json:"headerTemplate,omitempty"`
	FooterTemplate      string            `json:"footerTemplate,omitempty"`
	DisplayHeaderFooter bool              `json:"displayHeaderFooter,omitempty"`
	PageRanges          string            `json:"pageRanges,omitempty"`
	Scale               float64           `json:"scale,omitempty"`
	MaxPages            int               `json:"maxPages,omitempty"`
	Watermark           *WatermarkOptions `json:"watermark,omitempty"`
	Geolocation         *Geolocation      `json:"geolocation,omitempty"`
	Timezone            string            `json:"timezone,omitempty"`
	Timeout             int               `json:"timeout,omitempty"`
}

// Cookie represents a browser cookie.
type Cookie struct {
	Name   string `json:"name"`
	Value  string `json:"value"`
	Domain string `json:"domain,omitempty"`
}

// WatermarkOptions configures a PDF watermark.
type WatermarkOptions struct {
	Text     string  `json:"text"`
	FontSize float64 `json:"fontSize,omitempty"`
	Color    string  `json:"color,omitempty"`
	Opacity  float64 `json:"opacity,omitempty"`
	Rotation float64 `json:"rotation,omitempty"`
	Position string  `json:"position,omitempty"`
}

// Geolocation represents a geographic position.
type Geolocation struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Accuracy  float64 `json:"accuracy,omitempty"`
}

// PDFFromHTML generates a PDF from HTML or with full options.
func (c *Client) PDFFromHTML(req PDFRequest) ([]byte, error) {
	return c.post("/v1/pdf", req)
}

// DiffRequest is the JSON body for POST /v1/diff.
type DiffRequest struct {
	URL1      string      `json:"url1"`
	URL2      string      `json:"url2"`
	Width     int         `json:"width,omitempty"`
	Height    int         `json:"height,omitempty"`
	FullPage  bool        `json:"fullPage,omitempty"`
	Clean     bool        `json:"clean,omitempty"`
	BlockAds  interface{} `json:"blockAds,omitempty"`
	Threshold float64     `json:"threshold,omitempty"`
	Format    string      `json:"format,omitempty"` // "json" or "image"
}

// DiffResult is the JSON response from POST /v1/diff.
type DiffResult struct {
	DiffPixels     int     `json:"diffPixels"`
	TotalPixels    int     `json:"totalPixels"`
	DiffPercentage float64 `json:"diffPercentage"`
	Identical      bool    `json:"identical"`
	Width          int     `json:"width"`
	Height         int     `json:"height"`
	DiffImage      string  `json:"diffImage"` // base64
}

// Diff compares two URLs visually. Returns raw bytes (format=image) or JSON result.
func (c *Client) Diff(req DiffRequest) ([]byte, error) {
	return c.post("/v1/diff", req)
}

// DiffJSON compares two URLs and returns parsed diff stats.
func (c *Client) DiffJSON(req DiffRequest) (*DiffResult, error) {
	req.Format = "json"
	data, err := c.post("/v1/diff", req)
	if err != nil {
		return nil, err
	}
	var result DiffResult
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, fmt.Errorf("failed to parse diff response: %w", err)
	}
	return &result, nil
}

// BatchItem is a single item in a batch request.
type BatchItem struct {
	URL       string      `json:"url"`
	Type      string      `json:"type,omitempty"`
	Format    string      `json:"format,omitempty"`
	Clean     bool        `json:"clean,omitempty"`
	SmartWait bool        `json:"smartWait,omitempty"`
	BlockAds  interface{} `json:"blockAds,omitempty"`
}

// BatchResponse is the response from submitting a batch.
type BatchResponse struct {
	JobID     string `json:"jobId"`
	Status    string `json:"status"`
	Total     int    `json:"total"`
	StatusURL string `json:"statusUrl"`
}

// Batch submits a batch of URLs for processing.
func (c *Client) Batch(items []BatchItem, webhook string) (*BatchResponse, error) {
	body := map[string]interface{}{"items": items}
	if webhook != "" {
		body["webhook"] = webhook
	}
	data, err := c.post("/v1/batch", body)
	if err != nil {
		return nil, err
	}
	var resp BatchResponse
	if err := json.Unmarshal(data, &resp); err != nil {
		return nil, fmt.Errorf("failed to parse batch response: %w", err)
	}
	return &resp, nil
}

// BatchStatus checks the status of a batch job.
func (c *Client) BatchStatus(jobID string) (json.RawMessage, error) {
	data, err := c.get("/v1/batch/" + jobID)
	if err != nil {
		return nil, err
	}
	return json.RawMessage(data), nil
}

// Usage returns usage statistics for the current API key.
func (c *Client) Usage(days int) (json.RawMessage, error) {
	if days <= 0 {
		days = 30
	}
	data, err := c.get("/v1/usage?days=" + strconv.Itoa(days))
	if err != nil {
		return nil, err
	}
	return json.RawMessage(data), nil
}

// Error represents an API error.
type Error struct {
	StatusCode int
	Message    string
}

func (e *Error) Error() string {
	return fmt.Sprintf("pageyoink: %d %s", e.StatusCode, e.Message)
}

func (c *Client) get(path string) ([]byte, error) {
	req, err := http.NewRequest("GET", c.BaseURL+path, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("x-api-key", c.APIKey)
	return c.do(req)
}

func (c *Client) post(path string, body interface{}) ([]byte, error) {
	data, err := json.Marshal(body)
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequest("POST", c.BaseURL+path, bytes.NewReader(data))
	if err != nil {
		return nil, err
	}
	req.Header.Set("x-api-key", c.APIKey)
	req.Header.Set("Content-Type", "application/json")
	return c.do(req)
}

func (c *Client) do(req *http.Request) ([]byte, error) {
	resp, err := c.HTTP.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode >= 400 {
		msg := string(body)
		var errResp struct {
			Error string `json:"error"`
		}
		if json.Unmarshal(body, &errResp) == nil && errResp.Error != "" {
			msg = errResp.Error
		}
		return nil, &Error{StatusCode: resp.StatusCode, Message: msg}
	}

	return body, nil
}
