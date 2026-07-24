namespace Loupedeck.KiroMxConsolePlugin
{
    using System;

    public class OptimizeCommand : PluginDynamicCommand
    {
        private readonly BridgeClient _bridge = new BridgeClient();

        public OptimizeCommand()
            : base("Optimize", "Optimize performance.", "Kiro Prompts") { }

        protected override void RunCommand(String actionParameter)
        {
            _ = this._bridge.SendPromptAsync("Optimize the performance of this code. Remove unnecessary computations, reduce algorithmic complexity.");
        }

        protected override String GetCommandDisplayName(String actionParameter, PluginImageSize imageSize) => "Optimize";
    }
}
