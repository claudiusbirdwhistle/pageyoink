// Package pageyoink provides a Go client for the PageYoink screenshot, PDF, and OG image API.
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
	URL              string
	Format           string // "png" or "jpeg"
	Quality          int
	FullPage         bool
	Width            int
	Height           int
	DeviceScaleFactor float64
	Clean            bool
	SmartWait        bool
	BlockAds         bool
	MaxScroll        int
	CSS              string
	JS               string
	UserAgent        string
	Selector         string
	Transparent      bool
	Click            string
	ClickCount       int
	TTL              int
	Fresh            bool
	Timeout          int
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
	if opts.DeviceScaleFactor > 0 {
		params.Set("device_scale_factor", strconv.FormatFloat(opts.DeviceScaleFactor, 'f', -1, 64))
	}
	if opts.Clean {
		params.Set("clean", "true")
	}
	if opts.SmartWait {
		params.Set("smart_wait", "true")
	}
	if opts.BlockAds {
		params.Set("block_ads", "true")
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
func (c *Client) PDFFromURL(targetURL string) ([]byte, error) {
	params := url.Values{}
	params.Set("url", targetURL)
	return c.get("/v1/pdf?" + params.Encode())
}

// PDFRequest is the JSON body for POST /v1/pdf.
type PDFRequest struct {
	HTML               string            `json:"html,omitempty"`
	URL                string            `json:"url,omitempty"`
	Format             string            `json:"format,omitempty"`
	Landscape          bool              `json:"landscape,omitempty"`
	PrintBackground    *bool             `json:"printBackground,omitempty"`
	Margin             map[string]string `json:"margin,omitempty"`
	Clean              bool              `json:"clean,omitempty"`
	SmartWait          bool              `json:"smartWait,omitempty"`
	BlockAds           bool              `json:"blockAds,omitempty"`
	CSS                string            `json:"css,omitempty"`
	JS                 string            `json:"js,omitempty"`
	HeaderTemplate     string            `json:"headerTemplate,omitempty"`
	FooterTemplate     string            `json:"footerTemplate,omitempty"`
	DisplayHeaderFooter bool             `json:"displayHeaderFooter,omitempty"`
	PageRanges         string            `json:"pageRanges,omitempty"`
	UserAgent          string            `json:"userAgent,omitempty"`
	Watermark          *WatermarkOptions `json:"watermark,omitempty"`
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

// PDFFromHTML generates a PDF from HTML or with full options.
func (c *Client) PDFFromHTML(req PDFRequest) ([]byte, error) {
	return c.post("/v1/pdf", req)
}

// OGImageRequest is the JSON body for POST /v1/og-image.
type OGImageRequest struct {
	Title      string `json:"title"`
	Subtitle   string `json:"subtitle,omitempty"`
	Author     string `json:"author,omitempty"`
	Domain     string `json:"domain,omitempty"`
	Theme      string `json:"theme,omitempty"`
	BrandColor string `json:"brandColor,omitempty"`
	FontSize   string `json:"fontSize,omitempty"`
	Template   string `json:"template,omitempty"`
	Format     string `json:"format,omitempty"`
	Quality    int    `json:"quality,omitempty"`
}

// OGImage generates a social sharing image.
func (c *Client) OGImage(req OGImageRequest) ([]byte, error) {
	return c.post("/v1/og-image", req)
}

// BatchItem is a single item in a batch request.
type BatchItem struct {
	URL       string `json:"url"`
	Type      string `json:"type,omitempty"`
	Format    string `json:"format,omitempty"`
	Clean     bool   `json:"clean,omitempty"`
	SmartWait bool   `json:"smartWait,omitempty"`
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
