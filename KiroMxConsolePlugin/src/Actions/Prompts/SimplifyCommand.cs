namespace Loupedeck.KiroMxConsolePlugin
{
    using System;

    public class SimplifyCommand : PluginDynamicCommand
    {
        private readonly BridgeClient _bridge = new BridgeClient();

        public SimplifyCommand()
            : base("Simplify", "Simplify code, remove over-engineering.", "Kiro Prompts") { }

        protected override void RunCommand(String actionParameter)
        {
            _ = this._bridge.SendPromptAsync("Simplify this code. Remove over-engineering, flatten unnecessary abstractions, make it readable.");
        }

        protected override String GetCommandDisplayName(String actionParameter, PluginImageSize imageSize) => "Simplify";
    }
}
