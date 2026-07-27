namespace Loupedeck.KiroMxConsolePlugin
{
    using System;

    public class ReviewCommand : AnimatedPromptCommand
    {
        public ReviewCommand() : base("Review", "Comprehensive code review.", tileIndex: 6) { }

        protected override String Prompt => "review this code";

        protected override String GetCommandDisplayName(String actionParameter, PluginImageSize imageSize) => "Review";
    }
}
