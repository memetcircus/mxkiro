namespace Loupedeck.KiroMxConsolePlugin
{
    using System;

    /// <summary>
    /// Base class for prompt commands that show ghost animation on LCD when Kiro is working.
    /// Each command occupies a tile position (0-8) in the 3x3 grid.
    /// </summary>
    public abstract class AnimatedPromptCommand : PluginDynamicCommand
    {
        private readonly BridgeClient _bridge = new BridgeClient();
        private readonly Int32 _tileIndex;

        protected AnimatedPromptCommand(String displayName, String description, Int32 tileIndex)
            : base(displayName, description, "Kiro Prompts")
        {
            this._tileIndex = tileIndex;

            try
            {
                GhostAnimationManager.Instance.Subscribe(this.OnFrameChanged);
            }
            catch
            {
                // Animation not available — continue without it
            }
        }

        /// <summary>
        /// The short prompt text sent to Kiro chat.
        /// </summary>
        protected abstract String Prompt { get; }

        protected override void RunCommand(String actionParameter)
        {
            _ = this._bridge.SendPromptAsync(this.Prompt);
        }

        protected override BitmapImage GetCommandImage(String actionParameter, PluginImageSize imageSize)
        {
            try
            {
                var animation = GhostAnimationManager.Instance;
                if (animation.IsRunning)
                {
                    var tileData = animation.GetTileData(this._tileIndex);
                    if (tileData != null)
                    {
                        return BitmapImage.FromArray(tileData);
                    }
                }
            }
            catch
            {
                // Fall through to default
            }

            return null;
        }

        private void OnFrameChanged()
        {
            try
            {
                this.ActionImageChanged();
            }
            catch
            {
                // Ignore
            }
        }
    }
}
