package com.anikuro.app;

import android.Manifest;
import android.app.Dialog;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.Typeface;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.RelativeLayout;
import android.widget.TextView;
import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;
import androidx.activity.OnBackPressedCallback;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String CHANNEL_ID = "anikuro_episodes_channel";
    private static final int NOTIFICATION_PERMISSION_REQ_CODE = 1001;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Window window = getWindow();
        window.setFlags(WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED, WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED);
        window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        window.setStatusBarColor(Color.parseColor("#070913"));
        window.setNavigationBarColor(Color.parseColor("#070913"));

        // Ensure white/light status bar icons (battery, wifi, clock) on dark background
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(window, window.getDecorView());
        if (controller != null) {
            controller.setAppearanceLightStatusBars(false);
            controller.setAppearanceLightNavigationBars(false);
        }

        // Create notification channel
        createNotificationChannel();

        // Prompt for notification permission on Android 13+ when app opens
        requestNotificationPermissionOnStartup();

        WebView.setWebContentsDebuggingEnabled(true);
        if (getBridge() != null && getBridge().getWebView() != null) {
            WebView webView = getBridge().getWebView();
            WebSettings settings = webView.getSettings();
            settings.setCacheMode(WebSettings.LOAD_DEFAULT);
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
            try {
                settings.setRenderPriority(WebSettings.RenderPriority.HIGH);
            } catch (Exception ignored) {}
            settings.setEnableSmoothTransition(true);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                settings.setOffscreenPreRaster(true);
            }

            // Enable hardware layer acceleration and smooth overscroll
            webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
            webView.setOverScrollMode(View.OVER_SCROLL_IF_CONTENT_SCROLLS);

            // Register native notification & app bridge for web application
            AndroidNotificationBridge bridgeInstance = new AndroidNotificationBridge(this);
            webView.addJavascriptInterface(bridgeInstance, "AndroidNotificationBridge");
            webView.addJavascriptInterface(bridgeInstance, "AndroidBridge");
        }

        // Handle deep link if app launched via deep link intent
        handleDeepLinkIntent(getIntent());

        // Intercept Android hardware back button and gesture navigation
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (getBridge() != null && getBridge().getWebView() != null) {
                    getBridge().getWebView().evaluateJavascript(
                        "if (window.__anikuroHandleBack) { window.__anikuroHandleBack(); }",
                        null
                    );
                } else {
                    finish();
                }
            }
        });
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleDeepLinkIntent(intent);
    }

    private void handleDeepLinkIntent(Intent intent) {
        if (intent != null && intent.getData() != null) {
            String uriString = intent.getData().toString();
            if (uriString.startsWith("anikuro://") || uriString.contains("access_token=")) {
                deliverOAuthTokenToWebView(uriString);
            }
        }
    }

    public void deliverOAuthTokenToWebView(String urlOrToken) {
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().post(() -> {
                String safe = urlOrToken.replace("\\", "\\\\").replace("'", "\\'");
                getBridge().getWebView().evaluateJavascript(
                    "if (window.__anikuroHandleOAuthRedirect) { window.__anikuroHandleOAuthRedirect('" + safe + "'); }",
                    null
                );
            });
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            CharSequence name = "New Anime Episodes";
            String description = "Notifications when new anime episodes air";
            int importance = NotificationManager.IMPORTANCE_HIGH;
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID, name, importance);
            channel.setDescription(description);
            channel.enableLights(true);
            channel.setLightColor(Color.parseColor("#38bdf8"));
            channel.enableVibration(true);

            NotificationManager notificationManager = getSystemService(NotificationManager.class);
            if (notificationManager != null) {
                notificationManager.createNotificationChannel(channel);
            }
        }
    }

    private void requestNotificationPermissionOnStartup() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.POST_NOTIFICATIONS}, NOTIFICATION_PERMISSION_REQ_CODE);
            }
        }
    }

    public class AndroidNotificationBridge {
        private final Context context;

        public AndroidNotificationBridge(Context context) {
            this.context = context;
        }

        @JavascriptInterface
        public void openOAuthLogin(String oauthUrl) {
            runOnUiThread(() -> {
                try {
                    Dialog dialog = new Dialog(MainActivity.this, android.R.style.Theme_Black_NoTitleBar_Fullscreen);
                    RelativeLayout layout = new RelativeLayout(MainActivity.this);
                    layout.setBackgroundColor(Color.parseColor("#070913"));

                    // Header bar with Close button and title
                    RelativeLayout header = new RelativeLayout(MainActivity.this);
                    header.setId(View.generateViewId());
                    header.setBackgroundColor(Color.parseColor("#0d111d"));
                    int p = (int) (14 * getResources().getDisplayMetrics().density);
                    header.setPadding(p, p, p, p);

                    TextView title = new TextView(MainActivity.this);
                    title.setText("AniList Authorization (AniKuro)");
                    title.setTextColor(Color.WHITE);
                    title.setTextSize(15);
                    title.setTypeface(Typeface.DEFAULT_BOLD);
                    RelativeLayout.LayoutParams titleParams = new RelativeLayout.LayoutParams(
                        RelativeLayout.LayoutParams.WRAP_CONTENT,
                        RelativeLayout.LayoutParams.WRAP_CONTENT
                    );
                    titleParams.addRule(RelativeLayout.CENTER_VERTICAL);
                    header.addView(title, titleParams);

                    Button closeBtn = new Button(MainActivity.this);
                    closeBtn.setText("✕ Cancel");
                    closeBtn.setTextColor(Color.parseColor("#94a3b8"));
                    closeBtn.setBackgroundColor(Color.TRANSPARENT);
                    closeBtn.setTextSize(13);
                    RelativeLayout.LayoutParams btnParams = new RelativeLayout.LayoutParams(
                        RelativeLayout.LayoutParams.WRAP_CONTENT,
                        RelativeLayout.LayoutParams.WRAP_CONTENT
                    );
                    btnParams.addRule(RelativeLayout.ALIGN_PARENT_RIGHT);
                    btnParams.addRule(RelativeLayout.CENTER_VERTICAL);
                    closeBtn.setOnClickListener(v -> dialog.dismiss());
                    header.addView(closeBtn, btnParams);

                    RelativeLayout.LayoutParams headerParams = new RelativeLayout.LayoutParams(
                        RelativeLayout.LayoutParams.MATCH_PARENT,
                        RelativeLayout.LayoutParams.WRAP_CONTENT
                    );
                    headerParams.addRule(RelativeLayout.ALIGN_PARENT_TOP);
                    layout.addView(header, headerParams);

                    // Dedicated auth WebView
                    WebView authWebView = new WebView(MainActivity.this);
                    WebSettings ws = authWebView.getSettings();
                    ws.setJavaScriptEnabled(true);
                    ws.setDomStorageEnabled(true);
                    ws.setDatabaseEnabled(true);

                    authWebView.setWebViewClient(new WebViewClient() {
                        private boolean tokenHandled = false;

                        private boolean checkUrl(String url) {
                            if (url == null || tokenHandled) return false;
                            if (url.contains("access_token=") || url.startsWith("anikuro://")) {
                                tokenHandled = true;
                                deliverOAuthTokenToWebView(url);
                                dialog.dismiss();
                                return true;
                            }
                            return false;
                        }

                        @Override
                        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                            if (request != null && request.getUrl() != null) {
                                if (checkUrl(request.getUrl().toString())) {
                                    return true;
                                }
                            }
                            return super.shouldOverrideUrlLoading(view, request);
                        }

                        @Override
                        public boolean shouldOverrideUrlLoading(WebView view, String url) {
                            if (checkUrl(url)) {
                                return true;
                            }
                            return super.shouldOverrideUrlLoading(view, url);
                        }

                        @Override
                        public void onPageStarted(WebView view, String url, Bitmap favicon) {
                            checkUrl(url);
                            super.onPageStarted(view, url, favicon);
                        }
                    });

                    RelativeLayout.LayoutParams webParams = new RelativeLayout.LayoutParams(
                        RelativeLayout.LayoutParams.MATCH_PARENT,
                        RelativeLayout.LayoutParams.MATCH_PARENT
                    );
                    webParams.addRule(RelativeLayout.BELOW, header.getId());
                    layout.addView(authWebView, webParams);

                    dialog.setContentView(layout);
                    dialog.show();

                    authWebView.loadUrl(oauthUrl);
                } catch (Exception e) {
                    e.printStackTrace();
                    Intent browserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(oauthUrl));
                    startActivity(browserIntent);
                }
            });
        }

        @JavascriptInterface
        public boolean hasPermission() {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                return ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED;
            }
            return NotificationManagerCompat.from(context).areNotificationsEnabled();
        }

        @JavascriptInterface
        public void requestPermission() {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                runOnUiThread(() -> {
                    if (ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                        ActivityCompat.requestPermissions(MainActivity.this, new String[]{Manifest.permission.POST_NOTIFICATIONS}, NOTIFICATION_PERMISSION_REQ_CODE);
                    }
                });
            }
        }

        @JavascriptInterface
        public void showNotification(String title, String body, int id) {
            try {
                Intent intent = new Intent(context, MainActivity.class);
                intent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                PendingIntent pendingIntent = PendingIntent.getActivity(
                    context,
                    id,
                    intent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                );

                NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
                    .setSmallIcon(R.mipmap.ic_launcher)
                    .setContentTitle(title)
                    .setContentText(body)
                    .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                    .setPriority(NotificationCompat.PRIORITY_HIGH)
                    .setAutoCancel(true)
                    .setContentIntent(pendingIntent);

                NotificationManagerCompat notificationManager = NotificationManagerCompat.from(context);
                if (ActivityCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED || Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
                    notificationManager.notify(id, builder.build());
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        @JavascriptInterface
        public void triggerHaptic(String type) {
            try {
                runOnUiThread(() -> {
                    android.os.Vibrator vibrator = (android.os.Vibrator) context.getSystemService(Context.VIBRATOR_SERVICE);
                    if (vibrator != null && vibrator.hasVibrator()) {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                            if ("heavy".equalsIgnoreCase(type) || "success".equalsIgnoreCase(type)) {
                                vibrator.vibrate(android.os.VibrationEffect.createPredefined(android.os.VibrationEffect.EFFECT_HEAVY_CLICK));
                            } else if ("medium".equalsIgnoreCase(type) || "selection".equalsIgnoreCase(type)) {
                                vibrator.vibrate(android.os.VibrationEffect.createPredefined(android.os.VibrationEffect.EFFECT_CLICK));
                            } else {
                                vibrator.vibrate(android.os.VibrationEffect.createPredefined(android.os.VibrationEffect.EFFECT_TICK));
                            }
                        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                            long ms = ("heavy".equalsIgnoreCase(type) || "success".equalsIgnoreCase(type)) ? 30 : (("medium".equalsIgnoreCase(type) || "selection".equalsIgnoreCase(type)) ? 18 : 10);
                            vibrator.vibrate(android.os.VibrationEffect.createOneShot(ms, android.os.VibrationEffect.DEFAULT_AMPLITUDE));
                        } else {
                            long ms = ("heavy".equalsIgnoreCase(type) || "success".equalsIgnoreCase(type)) ? 30 : (("medium".equalsIgnoreCase(type) || "selection".equalsIgnoreCase(type)) ? 18 : 10);
                            vibrator.vibrate(ms);
                        }
                    }
                });
            } catch (Exception ignored) {}
        }

        @JavascriptInterface
        public void exitApp() {
            runOnUiThread(() -> {
                finishAffinity();
            });
        }
    }
}
