namespace Loupedeck.KiroMxConsolePlugin
{
    using System;

    /// <summary>
    /// Git commands - Commit, Push, Pull, Create PR via Kiro.
    /// </summary>
    public class KiroGitCommand : PluginDynamicCommand
    {
        private readonly BridgeClient _bridge;

        public KiroGitCommand()
            : base("Kiro Git", "Git operations via Kiro", "Kiro Git")
        {
            this._bridge = new BridgeClient();

            this.AddParameter("commit", "Commit", "Git");
            this.AddParameter("push", "Push", "Git");
            this.AddParameter("pull", "Pull", "Git");
            this.AddParameter("create-pr", "Create PR", "Git");
        }

        protected override void RunCommand(String actionParameter)
        {
            var prompt = actionParameter switch
            {
                "commit" => "Generate a commit message for the current changes and commit them.",
                "push" => "Run git push to push current branch to origin.",
                "pull" => "Run git pull to update from remote.",
                "create-pr" => "Create a pull request for the current branch with a descriptive title and summary.",
                _ => actionParameter
            };

            _ = this._bridge.SendPromptAsync(prompt);
            PluginLog.Info($"Kiro git: {actionParameter}");
        }

        protected override String GetCommandDisplayName(String actionParameter, PluginImageSize imageSize)
        {
            return actionParameter switch
            {
                "commit" => "📦\nCommit",
                "push" => "⬆️\nPush",
                "pull" => "⬇️\nPull",
                "create-pr" => "🔀\nCreate PR",
                _ => actionParameter
            };
        }
    }
}
