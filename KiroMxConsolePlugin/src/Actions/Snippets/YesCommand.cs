namespace Loupedeck.KiroMxConsolePlugin
{
    using System;
    using System.Net.Http;

    /// <summary>
    /// Sends "yes" to Kiro chat and presses Enter — quick approval.
    /// </summary>
    public class YesCommand : AnimatedCommand
    {
        private static readonly HttpClient Http = new HttpClient();

        public YesCommand()
            : base("Yes", "Send yes to Kiro chat", "Kiro Snippets", tileIndex: 8) { }

        protected override void RunCommand(String actionParameter)
        {
            _ = Http.GetAsync("http://localhost:9848/prompt?text=" + Uri.EscapeDataString("yes"));
            PluginLog.Info("✅ Yes sent");
        }

        protected override String GetCommandDisplayName(String actionParameter, PluginImageSize imageSize) =>
            "Yes";
    }
}
