namespace Loupedeck.KiroMxConsolePlugin
{
    using System;
    using System.Net.Http;

    /// <summary>
    /// Asks Kiro to generate a commit message and commit the current changes.
    /// </summary>
    public class GitCommitCommand : PluginDynamicCommand
    {
        private static readonly HttpClient Http = new HttpClient();

        public GitCommitCommand()
            : base("Git Commit", "Generate commit message and commit changes", "Kiro Controls") { }

        protected override void RunCommand(String actionParameter)
        {
            _ = Http.GetAsync("http://localhost:9848/prompt?text=" +
                Uri.EscapeDataString("Look at the current git changes, generate a clear commit message, and commit them."));
            PluginLog.Info("📦 Git Commit requested");
        }

        protected override String GetCommandDisplayName(String actionParameter, PluginImageSize imageSize) =>
            "Git\nCommit";
    }
}
