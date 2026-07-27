namespace Loupedeck.KiroMxConsolePlugin
{
    using System;

    public class OptimizeCommand : AnimatedPromptCommand
    {
        public OptimizeCommand() : base("Optimize", "Optimize performance.", tileIndex: 5) { }

        protected override String Prompt => "optimize this code";

        protected override String GetCommandDisplayName(String actionParameter, PluginImageSize imageSize) => "Optimize";
    }
}
