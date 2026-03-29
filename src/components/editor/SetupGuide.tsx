'use client';

interface SetupGuideProps {
  onStartSetup: () => void;
  onSkip: () => void;
}

const STEPS = [
  { icon: '🏢', title: 'スペースを追加', desc: 'デスクエリア、会議室、ラウンジなどを選んで配置します' },
  { icon: '🪑', title: '席数を設定', desc: '行数・列数を指定して、チームの人数に合わせたレイアウトを作ります' },
  { icon: '💾', title: '保存して共有', desc: '完成したらURLをチームに共有。すぐに集まれます' },
];

export default function SetupGuide({ onStartSetup, onSkip }: SetupGuideProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-[520px] overflow-hidden animate-float-in">
        {/* Header */}
        <div className="px-8 pt-8 pb-4 text-center">
          <div className="text-4xl mb-3">🎉</div>
          <h2 className="text-xl font-bold text-gray-900">フロアが作成されました！</h2>
          <p className="text-sm text-gray-500 mt-2">
            3ステップでオフィスを完成させましょう
          </p>
        </div>

        {/* Steps */}
        <div className="px-8 py-4 space-y-3">
          {STEPS.map((step, i) => (
            <div key={i} className="flex items-start gap-4 p-3 rounded-xl bg-gray-50">
              <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center text-lg flex-shrink-0">
                {step.icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-sky-500">STEP {i + 1}</span>
                  <span className="text-sm font-semibold text-gray-800">{step.title}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="px-8 py-5 bg-gray-50 flex gap-3">
          <button
            onClick={onSkip}
            className="flex-1 py-3 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
          >
            あとで設定する
          </button>
          <button
            onClick={onStartSetup}
            className="flex-[2] py-3 bg-sky-500 hover:bg-sky-400 text-white font-semibold text-sm rounded-xl transition-all hover:shadow-lg"
          >
            オフィスをセットアップする →
          </button>
        </div>
      </div>
    </div>
  );
}
