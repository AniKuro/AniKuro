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
            openChromeCustomTabLogin(oauthUrl);
        }

        @JavascriptInterface
        public void openChromeLogin(String oauthUrl) {
            openChromeCustomTabLogin(oauthUrl);
        }

        private void openChromeCustomTabLogin(String oauthUrl) {
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
        public void exitApp() {
            runOnUiThread(() -> {
                finishAffinity();
            });
        }
    }
}
