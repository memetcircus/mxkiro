namespace Loupedeck.KiroMxConsolePlugin
{
    using System;

    public class ExplainCommand : AnimatedPromptCommand
    {
        public ExplainCommand() : base("Explain", "Explain the code step by step.", tileIndex: 3) { }

        protected override String Prompt => "explain this file";

        protected override String GetCommandDisplayName(String actionParameter, PluginImageSize imageSize) => "Explain";
    }
}
