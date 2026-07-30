namespace Loupedeck.KiroMxConsolePlugin
{
    using System;
    using System.Net.Http;

    /// <summary>
    /// Reads the current chat input text and sends it to Kiro
    /// with a prefix asking to restructure it as a better prompt.
    /// </summary>
    public class StructPromptCommand : PluginDynamicCommand
    {
        private static readonly HttpClient Http = new HttpClient();

        public StructPromptCommand()
            : base("Struct Prompt", "Restructure your prompt for clarity", "Kiro Snippets") { }

        protected override void RunCommand(String actionParameter)
        {
            _ = Http.GetAsync("http://localhost:9848/struct");
            PluginLog.Info("📐 Struct prompt requested");
        }

        protected override String GetCommandDisplayName(String actionParameter, PluginImageSize imageSize) =>
            "Struct";
    }
}
