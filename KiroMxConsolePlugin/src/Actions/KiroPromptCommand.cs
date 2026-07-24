namespace Loupedeck.KiroMxConsolePlugin
{
    using System;

    /// <summary>
    /// Sends a predefined prompt to Kiro when the button is pressed.
    /// Each instance can be configured with a different prompt via actionParameter.
    /// </summary>
    public class KiroPromptCommand : PluginDynamicCommand
    {
        private readonly BridgeClient _bridge;

        public KiroPromptCommand()
            : base("Kiro Prompt", "Send a prompt to Kiro", "Kiro Prompts")
        {
            this._bridge = new BridgeClient();

            // Add predefined prompts as action parameters
            this.AddParameter("criticize", "Eleştir", "Prompts");
            this.AddParameter("refactor", "Refactor", "Prompts");
            this.AddParameter("test-write", "Test Yaz", "Prompts");
            this.AddParameter("explain", "Açıkla", "Prompts");
            this.AddParameter("fix-bug", "Fix Bug", "Prompts");
            this.AddParameter("optimize", "Optimize", "Prompts");
            this.AddParameter("review", "Review", "Prompts");
            this.AddParameter("document", "Dokümante", "Prompts");
            this.AddParameter("simplify", "Basitleştir", "Prompts");
        }

        protected override void RunCommand(String actionParameter)
        {
            var prompt = this.GetPromptForAction(actionParameter);
            _ = this._bridge.SendPromptAsync(prompt);
            this.ActionImageChanged();
            PluginLog.Info($"Kiro prompt sent: {actionParameter}");
        }

        protected override String GetCommandDisplayName(String actionParameter, PluginImageSize imageSize)
        {
            return actionParameter switch
            {
                "criticize" => "🔍\nEleştir",
                "refactor" => "♻️\nRefactor",
                "test-write" => "🧪\nTest Yaz",
                "explain" => "💡\nAçıkla",
                "fix-bug" => "🐛\nFix Bug",
                "optimize" => "⚡\nOptimize",
                "review" => "👀\nReview",
                "document" => "📝\nDokümante",
                "simplify" => "✂️\nBasitleştir",
                _ => actionParameter
            };
        }

        private String GetPromptForAction(String actionParameter)
        {
            return actionParameter switch
            {
                "criticize" => "Dürüst ol, eleştir. Bu kodda ne yanlış olduğunu söyle. Daha iyi bir fikrin varsa alternatif öner.",
                "refactor" => "Bu kodu refactor et. SOLID prensiplerini uygula, tekrarları kaldır, okunabilirliği artır.",
                "test-write" => "Bu kod için kapsamlı testler yaz. Edge case'leri, hata durumlarını ve normal akışı test et.",
                "explain" => "Bu kodu bana açıkla. Ne yaptığını, neden bu şekilde yazıldığını adım adım anlat.",
                "fix-bug" => "Bu koddaki bug'ı bul ve düzelt. Önce root cause'u açıkla, sonra minimal fix uygula.",
                "optimize" => "Bu kodun performansını optimize et. Gereksiz hesaplamaları kaldır, algoritma karmaşıklığını düşür.",
                "review" => "Bu kodu kapsamlı review et. Bug potansiyeli, kod kalitesi, performans, güvenlik açıklarına bak.",
                "document" => "Bu kodu dokümante et. JSDoc/TSDoc yorumları ekle, her public fonksiyon için açıklama yaz.",
                "simplify" => "Bu kodu basitleştir. Over-engineering'i kaldır, karmaşık yapıları okunabilir hale getir.",
                _ => actionParameter
            };
        }
    }
}
