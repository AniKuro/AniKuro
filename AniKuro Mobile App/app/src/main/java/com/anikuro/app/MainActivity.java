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
    private int cachedBottomNavInset = 0;
    private boolean cachedIs3ButtonNav = false;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Window window = getWindow();
        window.setFlags(WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED, WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED);
        window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        window.setStatusBarColor(Color.TRANSPARENT);
        window.setNavigationBarColor(Color.TRANSPARENT);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            window.setNavigationBarContrastEnforced(false);
            window.setStatusBarContrastEnforced(false);
        }

        // Enable edge-to-edge layout so insets are reliably measured and reported
        WindowCompat.setDecorFitsSystemWindows(window, false);

        // Ensure white/light status bar icons (battery, wifi, clock) on dark background
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(window, window.getDecorView());
        if (controller != null) {
            controller.setAppearanceLightStatusBars(false);
            controller.setAppearanceLightNavigationBars(false);
        }

        // Listen for window insets and accurately dispatch exact DP padding to CSS variables
        androidx.core.view.ViewCompat.setOnApplyWindowInsetsListener(window.getDecorView(), (v, insets) -> {
            androidx.core.graphics.Insets navInsets = insets.getInsets(androidx.core.view.WindowInsetsCompat.Type.navigationBars());
            androidx.core.graphics.Insets statusInsets = insets.getInsets(androidx.core.view.WindowInsetsCompat.Type.statusBars());
            androidx.core.graphics.Insets cutoutInsets = insets.getInsets(androidx.core.view.WindowInsetsCompat.Type.displayCutout());

            float density = getResources().getDisplayMetrics().density;

            // Compute exact navigation bar height in CSS DP (e.g. ~48dp on 3-button nav, ~20-28dp on gesture nav)
            int bottomDp = density > 0 ? Math.round(navInsets.bottom / density) : 0;
            cachedBottomNavInset = bottomDp;
            cachedIs3ButtonNav = (bottomDp >= 38);

            // Compute exact status bar / cutout height in CSS DP (e.g. ~24-40dp)
            int topDp = density > 0 ? Math.max(Math.round(statusInsets.top / density), Math.round(cutoutInsets.top / density)) : 0;

            if (getBridge() != null && getBridge().getWebView() != null) {
                final int finalTop = topDp;
                final int finalBottom = bottomDp;
                final boolean is3Btn = cachedIs3ButtonNav;
                getBridge().getWebView().post(() -> {
                    getBridge().getWebView().evaluateJavascript(
                        String.format(java.util.Locale.US, 
                            "document.documentElement.style.setProperty('--safe-area-inset-top', '%dpx'); " +
                            "document.documentElement.style.setProperty('--safe-area-inset-bottom', '%dpx'); " +
                            "document.documentElement.setAttribute('data-nav-mode', '%s');", 
                            finalTop, finalBottom, is3Btn ? "buttons" : "gestures"),
                        null
                    );
                });
            }
            return insets;
        });

        // Create notification channel
        createNotificationChannel();

        // Prompt for notification permission on Android 13+ when app opens
        requestNotificationPermissionOnStartup();

        // Only enable WebView debugging in debuggable builds for security
        boolean isDebuggable = (getApplicationInfo().flags & android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE) != 0;
        WebView.setWebContentsDebuggingEnabled(isDebuggable);

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
            settings.setAllowFileAccess(false);
            settings.setAllowContentAccess(false);
            settings.setMediaPlaybackRequiresUserGesture(false);
            settings.setJavaScriptCanOpenWindowsAutomatically(true);
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
    public void onResume() {
        super.onResume();
        updateSystemBarInsets();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            updateSystemBarInsets();
        }
    }

    public void updateSystemBarInsets() {
        if (getBridge() == null || getBridge().getWebView() == null) return;
        try {
            Window window = getWindow();
            if (window == null) return;
            androidx.core.view.WindowInsetsCompat insets = androidx.core.view.ViewCompat.getRootWindowInsets(window.getDecorView());
            if (insets != null) {
                androidx.core.graphics.Insets navInsets = insets.getInsets(androidx.core.view.WindowInsetsCompat.Type.navigationBars());
                androidx.core.graphics.Insets statusInsets = insets.getInsets(androidx.core.view.WindowInsetsCompat.Type.statusBars());
                androidx.core.graphics.Insets cutoutInsets = insets.getInsets(androidx.core.view.WindowInsetsCompat.Type.displayCutout());

                float density = getResources().getDisplayMetrics().density;
                int bottomDp = density > 0 ? Math.round(navInsets.bottom / density) : 0;
                cachedBottomNavInset = bottomDp;
                cachedIs3ButtonNav = (bottomDp >= 38);
                int topDp = density > 0 ? Math.max(Math.round(statusInsets.top / density), Math.round(cutoutInsets.top / density)) : 0;

                final int finalTop = topDp;
                final int finalBottom = bottomDp;
                final boolean is3Btn = cachedIs3ButtonNav;

                getBridge().getWebView().post(() -> {
                    getBridge().getWebView().evaluateJavascript(
                        String.format(java.util.Locale.US,
                            "document.documentElement.style.setProperty('--safe-area-inset-top', '%dpx'); " +
                            "document.documentElement.style.setProperty('--safe-area-inset-bottom', '%dpx'); " +
                            "document.documentElement.setAttribute('data-nav-mode', '%s');",
                            finalTop, finalBottom, is3Btn ? "buttons" : "gestures"),
                        null
                    );
                });
            }
        } catch (Exception ignored) {}
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleDeepLinkIntent(intent);
    }

    private void handleDeepLinkIntent(Intent intent) {
        if (intent != null) {
            String uriString = intent.getDataString();
            if (uriString == null && intent.getData() != null) {
                uriString = intent.getData().toString();
            }
            if (uriString != null) {
                if (intent.getData() != null && intent.getData().getFragment() != null && !uriString.contains("#")) {
                    uriString = uriString + "#" + intent.getData().getFragment();
                }
                if (uriString.startsWith("anikuro://") || uriString.contains("access_token=")) {
                    deliverOAuthTokenToWebView(uriString);
                }
            }
        }
    }

    public void deliverOAuthTokenToWebView(String urlOrToken) {
        if (getBridge() != null && getBridge().getWebView() != null && urlOrToken != null) {
            getBridge().getWebView().post(() -> {
                String safe = urlOrToken
                    .replace("\\", "\\\\")
                    .replace("'", "\\'")
                    .replace("\n", "\\n")
                    .replace("\r", "\\r");
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
        private final java.util.concurrent.ExecutorService queryExecutor = java.util.concurrent.Executors.newFixedThreadPool(4);

        public AndroidNotificationBridge(Context context) {
            this.context = context;
        }

        @JavascriptInterface
        public void executeAniListQueryAsync(final String requestId, final String query, final String variablesJson, final String token) {
            queryExecutor.execute(() -> {
                String response = executeAniListQuery(query, variablesJson, token);
                runOnUiThread(() -> {
                    try {
                        if (getBridge() != null && getBridge().getWebView() != null) {
                            org.json.JSONObject payload = new org.json.JSONObject();
                            payload.put("requestId", requestId);
                            payload.put("response", response != null ? response : "");
                            payload.put("success", response != null);
                            String js = "if (window.__anikuroHandleNativeQueryResponse) { window.__anikuroHandleNativeQueryResponse(" + payload.toString() + "); }";
                            getBridge().getWebView().evaluateJavascript(js, null);
                        }
                    } catch (Exception e) {
                        android.util.Log.e("AniKuroBridge", "Failed to dispatch async query response", e);
                    }
                });
            });
        }

        @JavascriptInterface
        public String executeAniListQuery(String query, String variablesJson, String token) {
            java.net.HttpURLConnection conn = null;
            try {
                java.net.URL url = new java.net.URL("https://graphql.anilist.co");
                conn = (java.net.HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setRequestProperty("Accept", "application/json");
                conn.setRequestProperty("Origin", "https://anilist.co");
                conn.setRequestProperty("Referer", "https://anilist.co/");
                conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36");
                if (token != null && !token.trim().isEmpty()) {
                    conn.setRequestProperty("Authorization", "Bearer " + token.trim());
                }
                conn.setConnectTimeout(8000);
                conn.setReadTimeout(12000);
                conn.setDoOutput(true);

                org.json.JSONObject body = new org.json.JSONObject();
                body.put("query", query);
                if (variablesJson != null && !variablesJson.trim().isEmpty() && !variablesJson.trim().equals("{}")) {
                    body.put("variables", new org.json.JSONObject(variablesJson));
                }

                try (java.io.OutputStream os = conn.getOutputStream()) {
                    byte[] input = body.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
                    os.write(input, 0, input.length);
                }

                int code = conn.getResponseCode();
                java.io.InputStream is = (code >= 200 && code < 400) ? conn.getInputStream() : conn.getErrorStream();
                if (is == null) return null;
                try (java.io.BufferedReader br = new java.io.BufferedReader(new java.io.InputStreamReader(is, java.nio.charset.StandardCharsets.UTF_8))) {
                    StringBuilder response = new StringBuilder();
                    String line;
                    while ((line = br.readLine()) != null) {
                        response.append(line);
                    }
                    return response.toString();
                }
            } catch (Exception e) {
                android.util.Log.e("AniKuroBridge", "AniList query failed", e);
                return null;
            } finally {
                if (conn != null) conn.disconnect();
            }
        }

        @JavascriptInterface
        public void openOAuthLogin(String oauthUrl) {
            openChromeCustomTabLogin(oauthUrl);
        }

        @JavascriptInterface
        public void openChromeLogin(String oauthUrl) {
            openChromeCustomTabLogin(oauthUrl);
        }

        private void openChromeCustomTabLogin(String oauthUrl) {
            if (oauthUrl == null || !oauthUrl.startsWith("https://anilist.co/")) {
                return;
            }
            runOnUiThread(() -> {
                try {
                    androidx.browser.customtabs.CustomTabsIntent customTabsIntent = new androidx.browser.customtabs.CustomTabsIntent.Builder()
                        .setShowTitle(true)
                        .setColorScheme(androidx.browser.customtabs.CustomTabsIntent.COLOR_SCHEME_DARK)
                        .setDefaultColorSchemeParams(new androidx.browser.customtabs.CustomTabColorSchemeParams.Builder()
                            .setToolbarColor(Color.parseColor("#090d16"))
                            .build())
                        .build();

                    try {
                        PackageManager pm = getPackageManager();
                        pm.getPackageInfo("com.android.chrome", 0);
                        customTabsIntent.intent.setPackage("com.android.chrome");
                    } catch (Exception ignored) {}

                    customTabsIntent.intent.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
                    customTabsIntent.launchUrl(MainActivity.this, Uri.parse(oauthUrl));
                } catch (Exception e) {
                    try {
                        Intent fallbackIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(oauthUrl));
                        fallbackIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        startActivity(fallbackIntent);
                    } catch (Exception fallbackErr) {
                        fallbackErr.printStackTrace();
                    }
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

                android.graphics.Bitmap largeIcon = null;
                try {
                    largeIcon = android.graphics.BitmapFactory.decodeResource(context.getResources(), R.mipmap.ic_launcher);
                } catch (Exception ignored) {}

                NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
                    .setSmallIcon(R.drawable.ic_notification)
                    .setContentTitle(title)
                    .setContentText(body)
                    .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                    .setColor(Color.parseColor("#38bdf8"))
                    .setPriority(NotificationCompat.PRIORITY_HIGH)
                    .setAutoCancel(true)
                    .setContentIntent(pendingIntent);

                if (largeIcon != null) {
                    builder.setLargeIcon(largeIcon);
                }

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
        public int getStatusBarHeight() {
            int resourceId = getResources().getIdentifier("status_bar_height", "dimen", "android");
            if (resourceId > 0) {
                int px = getResources().getDimensionPixelSize(resourceId);
                float density = getResources().getDisplayMetrics().density;
                return density > 0 ? Math.round(px / density) : 28;
            }
            return 28;
        }

        @JavascriptInterface
        public int getSafeBottomInset() {
            return cachedBottomNavInset;
        }

        @JavascriptInterface
        public boolean is3ButtonNav() {
            return cachedIs3ButtonNav;
        }

        @JavascriptInterface
        public void syncInsets() {
            runOnUiThread(() -> updateSystemBarInsets());
        }

        @JavascriptInterface
        public void openExternalUrl(String url) {
            if (url == null || url.trim().isEmpty()) return;
            runOnUiThread(() -> {
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url.trim()));
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(intent);
                } catch (Exception e) {
                    e.printStackTrace();
                }
            });
        }

        @JavascriptInterface
        public void exitApp() {
            runOnUiThread(() -> {
                finishAffinity();
            });
        }
    }
}
