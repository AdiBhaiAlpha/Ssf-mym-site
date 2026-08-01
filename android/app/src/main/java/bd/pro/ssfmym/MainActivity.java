package bd.pro.ssfmym;

import android.app.DownloadManager;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.net.http.SslError;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.SslErrorHandler;
import android.webkit.URLUtil;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;

public class MainActivity extends BridgeActivity {

    private static final String OFFLINE_HTML = "<!DOCTYPE html>" +
        "<html>" +
        "<head>" +
        "  <meta charset=\"UTF-8\">" +
        "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">" +
        "  <title>সংযোগ বিচ্ছিন্ন</title>" +
        "  <link href=\"https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;600;700&display=swap\" rel=\"stylesheet\">" +
        "  <style>" +
        "    body {" +
        "      font-family: 'Hind Siliguri', 'Inter', sans-serif;" +
        "      background-color: #f8fafc;" +
        "      color: #1e293b;" +
        "      display: flex;" +
        "      flex-direction: column;" +
        "      align-items: center;" +
        "      justify-content: center;" +
        "      height: 100vh;" +
        "      margin: 0;" +
        "      padding: 20px;" +
        "      text-align: center;" +
        "      box-sizing: border-box;" +
        "    }" +
        "    .card {" +
        "      background: white;" +
        "      padding: 40px 30px;" +
        "      border-radius: 12px;" +
        "      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);" +
        "      max-width: 400px;" +
        "      width: 100%;" +
        "    }" +
        "    .icon {" +
        "      font-size: 64px;" +
        "      margin-bottom: 20px;" +
        "      color: #be123c;" +
        "    }" +
        "    h1 {" +
        "      font-size: 24px;" +
        "      margin-top: 0;" +
        "      margin-bottom: 10px;" +
        "      color: #0f172a;" +
        "      font-weight: 700;" +
        "    }" +
        "    p {" +
        "      font-size: 15px;" +
        "      color: #64748b;" +
        "      line-height: 1.6;" +
        "      margin-bottom: 30px;" +
        "    }" +
        "    .btn {" +
        "      background-color: #be123c;" +
        "      color: white;" +
        "      border: none;" +
        "      padding: 12px 28px;" +
        "      font-size: 16px;" +
        "      border-radius: 6px;" +
        "      font-weight: 600;" +
        "      cursor: pointer;" +
        "      transition: background-color 0.2s;" +
        "      width: 100%;" +
        "      box-sizing: border-box;" +
        "    }" +
        "    .btn:hover {" +
        "      background-color: #9f1239;" +
        "    }" +
        "  </style>" +
        "</head>" +
        "<body>" +
        "  <div class=\"card\">" +
        "    <div class=\"icon\">📶</div>" +
        "    <h1>সংযোগ বিচ্ছিন্ন হয়েছে</h1>" +
        "    <p>অনুগ্রহ করে আপনার ইন্টারনেট সংযোগটি পরীক্ষা করুন এবং আবার চেষ্টা করুন।</p>" +
        "    <button class=\"btn\" onclick=\"window.location.href='https://ssfmym.pro.bd'\">পুনরায় চেষ্টা করুন</button>" +
        "  </div>" +
        "</body>" +
        "</html>";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 1. Style status bar with crimson red theme to match Socialist Students Front branding
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            Window window = getWindow();
            window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            window.setStatusBarColor(Color.parseColor("#be123c")); // deep rose-700
        }

        // 2. Fetch the underlying native Android WebView initialized by Capacitor
        WebView webView = this.bridge.getWebView();
        if (webView != null) {
            WebSettings settings = webView.getSettings();

            // Configure performance and rendering parameters
            settings.setSupportZoom(false);
            settings.setBuiltInZoomControls(false);
            settings.setDisplayZoomControls(false);
            settings.setDatabaseEnabled(true);
            settings.setDomStorageEnabled(true);
            settings.setJavaScriptEnabled(true);

            // Enable hardware acceleration
            webView.setLayerType(WebView.LAYER_TYPE_HARDWARE, null);

            // 3. Register native file download listener
            webView.setDownloadListener(new DownloadListener() {
                @Override
                public void onDownloadStart(String url, String userAgent, String contentDisposition, String mimetype, long contentLength) {
                    try {
                        DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
                        request.setMimeType(mimetype);
                        
                        // Parse name cleanly
                        String fileName = URLUtil.guessFileName(url, contentDisposition, mimetype);
                        
                        request.setDescription("সমাজতান্ত্রিক ছাত্র ফ্রন্ট ফাইল ডাউনলোড...");
                        request.setTitle(fileName);
                        request.allowScanningByMediaScanner();
                        request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                        request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName);
                        
                        // Synchronize active authentication cookies so protected file routes can download
                        String cookies = CookieManager.getInstance().getCookie(url);
                        request.addRequestHeader("cookie", cookies);
                        request.addRequestHeader("User-Agent", userAgent);
                        
                        DownloadManager dm = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
                        if (dm != null) {
                            dm.enqueue(request);
                            Toast.makeText(getApplicationContext(), "ডাউনলোড শুরু হয়েছে...", Toast.LENGTH_SHORT).show();
                        }
                    } catch (Exception e) {
                        Toast.makeText(getApplicationContext(), "ডাউনলোড ব্যর্থ হয়েছে: " + e.getLocalizedMessage(), Toast.LENGTH_LONG).show();
                    }
                }
            });

            // 4. Set custom WebViewClient that extends Capacitor's default to capture specialized protocols
            webView.setWebViewClient(new CustomBridgeWebViewClient(this.bridge));
        }
    }

    // Capture hardware back press to navigate back in webview history instead of shutting down the application immediately
    @Override
    public void onBackPressed() {
        WebView webView = this.bridge.getWebView();
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    // Subclass Capacitor's native client to preserve the JS-bridge while adding advanced application routing
    private class CustomBridgeWebViewClient extends BridgeWebViewClient {

        public CustomBridgeWebViewClient(Bridge bridge) {
            super(bridge);
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            String url = request.getUrl().toString();

            // Intercept tel:, mailto: and sms:
            if (url.startsWith("tel:") || url.startsWith("mailto:") || url.startsWith("sms:")) {
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                    view.getContext().startActivity(intent);
                    return true;
                } catch (Exception e) {
                    return false;
                }
            }

            // Route WhatsApp links
            if (url.contains("wa.me") || url.startsWith("whatsapp:")) {
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                    view.getContext().startActivity(intent);
                    return true;
                } catch (Exception e) {
                    Toast.makeText(view.getContext(), "হোয়াটসঅ্যাপ ইনস্টল করা নেই", Toast.LENGTH_SHORT).show();
                    return true;
                }
            }

            // Route Telegram links
            if (url.contains("t.me") || url.startsWith("tg:")) {
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                    view.getContext().startActivity(intent);
                    return true;
                } catch (Exception e) {
                    Toast.makeText(view.getContext(), "টেলিগ্রাম ইনস্টল করা নেই", Toast.LENGTH_SHORT).show();
                    return true;
                }
            }

            // Route Messenger links
            if (url.contains("m.me") || url.startsWith("fb-messenger:")) {
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                    view.getContext().startActivity(intent);
                    return true;
                } catch (Exception e) {
                    Toast.makeText(view.getContext(), "মেসেঞ্জার ইনস্টল করা নেই", Toast.LENGTH_SHORT).show();
                    return true;
                }
            }

            // Route Facebook app links
            if (url.contains("facebook.com") || url.startsWith("fb:")) {
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                    view.getContext().startActivity(intent);
                    return true;
                } catch (Exception e) {
                    return false;
                }
            }

            // Route Google Maps links
            if (url.contains("maps.google.com") || url.contains("goo.gl/maps") || url.startsWith("geo:")) {
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                    intent.setPackage("com.google.android.apps.maps");
                    view.getContext().startActivity(intent);
                    return true;
                } catch (Exception e) {
                    // Fail over to system browser
                    return false;
                }
            }

            // Block web OAuth navigation attempts - native GoogleAuth plugin handles authentication via Google Play Services
            if (url.contains("accounts.google.com") || url.contains("google.com/signin") || url.contains("firebaseapp.com/__/auth/")) {
                return true;
            }

            // Route external links out of the application to avoid hijacking user session
            if (!url.contains("ssfmym.pro.bd") && 
                !url.contains("localhost")) {
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                    view.getContext().startActivity(intent);
                    return true;
                } catch (Exception e) {
                    return false;
                }
            }

            return super.shouldOverrideUrlLoading(view, request);
        }

        // Handle SSL certificate failures cleanly by canceling for strong security (preventing MITM)
        @Override
        public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
            handler.cancel();
        }

        // Detect connection interruptions or DNS timeouts and serve a beautiful local Bangla recovery page
        @Override
        public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
            if (request.isForMainFrame()) {
                view.loadDataWithBaseURL("https://ssfmym.pro.bd", OFFLINE_HTML, "text/html", "UTF-8", null);
            }
            super.onReceivedError(view, request, error);
        }
    }
}
