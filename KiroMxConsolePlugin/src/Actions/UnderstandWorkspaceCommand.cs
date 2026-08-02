namespace Loupedeck.KiroMxConsolePlugin
{
    using System;
    using System.Net.Http;

    /// <summary>
    /// Sends "understand this workspace" prompt to Kiro.
    /// Best used as the first action when opening a new project.
    /// </summary>
    public class UnderstandWorkspaceCommand : PluginDynamicCommand
    {
        private static readonly HttpClient Http = new HttpClient();

        public UnderstandWorkspaceCommand()
            : base("Understand Workspace", "Ask Kiro to analyze and summarize the project", "Kiro Controls") { }

        protected override void RunCommand(String actionParameter)
        {
            _ = Http.GetAsync("http://localhost:9848/prompt?text=" +
                Uri.EscapeDataString("Analyze this workspace. Summarize what this project is, what the key folders and files are, and what context you need before helping me."));
            PluginLog.Info("🔍 Understand workspace requested");
        }

        protected override String GetCommandDisplayName(String actionParameter, PluginImageSize imageSize) =>
            "Understand\nWorkspace";
    }
}
