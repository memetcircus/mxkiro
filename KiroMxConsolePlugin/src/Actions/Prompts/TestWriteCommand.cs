namespace Loupedeck.KiroMxConsolePlugin
{
    using System;

    public class TestWriteCommand : AnimatedPromptCommand
    {
        public TestWriteCommand() : base("Write Tests", "Write comprehensive tests.", tileIndex: 2) { }

        protected override String Prompt => "write tests for this code";

        protected override String GetCommandDisplayName(String actionParameter, PluginImageSize imageSize) => "Write Tests";
    }
}
