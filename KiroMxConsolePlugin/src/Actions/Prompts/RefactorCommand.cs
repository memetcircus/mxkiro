namespace Loupedeck.KiroMxConsolePlugin
{
    using System;

    public class RefactorCommand : PluginDynamicCommand
    {
        private readonly BridgeClient _bridge = new BridgeClient();

        public RefactorCommand()
            : base("Refactor", "Refactor the code, apply SOLID principles.", "Kiro Prompts") { }

        protected override void RunCommand(String actionParameter)
        {
            _ = this._bridge.SendPromptAsync("Refactor this code. Apply SOLID principles, remove duplication, improve readability.");
        }

        protected override String GetCommandDisplayName(String actionParameter, PluginImageSize imageSize) => "Refactor";
    }
}
