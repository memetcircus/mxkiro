namespace Loupedeck.KiroMxConsolePlugin
{
    using System;

    /// <summary>
    /// Roller/dial adjustment for switching AI models.
    /// </summary>
    public class KiroModelDial : PluginDynamicAdjustment
    {
        private readonly BridgeClient _bridge;
        private Int32 _modelIndex = 0;

        private static readonly String[] Models = new[]
        {
            "Auto",
            "Opus",
            "Sonnet",
            "Haiku",
            "DeepSeek"
        };

        public KiroModelDial()
            : base("Model Select", "Switch AI model", "Kiro Controls", hasReset: false)
        {
            this._bridge = new BridgeClient();
        }

        protected override void ApplyAdjustment(String actionParameter, Int32 diff)
        {
            this._modelIndex += diff > 0 ? 1 : -1;

            if (this._modelIndex < 0) this._modelIndex = Models.Length - 1;
            if (this._modelIndex >= Models.Length) this._modelIndex = 0;

            _ = this._bridge.SendModelSwitchAsync(diff);
            this.AdjustmentValueChanged();
            PluginLog.Info($"Model switched to: {Models[this._modelIndex]}");
        }

        protected override void RunCommand(String actionParameter)
        {
            // No reset for model dial
        }

        protected override String GetAdjustmentValue(String actionParameter) =>
            Models[this._modelIndex];
    }
}
