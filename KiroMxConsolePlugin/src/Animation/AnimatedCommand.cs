namespace Loupedeck.KiroMxConsolePlugin
{
    using System;

    /// <summary>
    /// Base class for any command that shows ghost animation on LCD when Kiro is working.
    /// Subclasses implement their own RunCommand logic.
    /// Each command occupies a tile position (0-8) in the 3x3 grid.
    /// </summary>
    public abstract class AnimatedCommand : PluginDynamicCommand
    {
        private readonly Int32 _tileIndex;

        protected AnimatedCommand(String displayName, String description, String groupName, Int32 tileIndex)
            : base(displayName, description, groupName)
        {
            this._tileIndex = tileIndex;

            try
            {
                GhostAnimationManager.Instance.Subscribe(this.OnFrameChanged);
            }
            catch
            {
                // Animation not available
            }
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
