namespace Loupedeck.KiroMxConsolePlugin
{
    using System;

    public class TestWriteCommand : PluginDynamicCommand
    {
        private readonly BridgeClient _bridge = new BridgeClient();

        public TestWriteCommand()
            : base("Write Tests", "Write comprehensive tests.", "Kiro Prompts") { }

        protected override void RunCommand(String actionParameter)
        {
            _ = this._bridge.SendPromptAsync("Write comprehensive tests for this code. Cover edge cases, error scenarios, and happy path.");
        }

        protected override String GetCommandDisplayName(String actionParameter, PluginImageSize imageSize) => "Write Tests";
    }
}
