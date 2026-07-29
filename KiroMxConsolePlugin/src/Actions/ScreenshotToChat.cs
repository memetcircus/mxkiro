namespace Loupedeck.KiroMxConsolePlugin
{
    using System;
    using System.Net.Http;

    public class ScreenshotToChat : AnimatedCommand
    {
        private static readonly HttpClient Http = new HttpClient();

        public ScreenshotToChat()
            : base("Screenshot", "Capture screen area and paste into Kiro chat", "Kiro Controls", tileIndex: 0) { }

        protected override void RunCommand(String actionParameter)
        {
            _ = Http.GetAsync("http://localhost:9848/screenshot");
            PluginLog.Info("📸 Screenshot to chat requested");
        }

        protected override String GetCommandDisplayName(String actionParameter, PluginImageSize imageSize) =>
            "Screen\nCapture";
    }
}
