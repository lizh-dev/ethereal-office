'use client';

interface SetupGuideProps {
  onStartSetup: () => void;
  onSkip: () => void;
}

export default function SetupGuide({ onStartSetup, onSkip }: SetupGuideProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-[480px] overflow-hidden animate-float-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-500 to-blue-500 px-8 py-6 text-white text-center">
          <div className="text-3xl mb-2">🏢</div>
          <h2 className="text-lg font-bold">オフィスを作りましょう！</h2>
          <p className="text-sm text-sky-100 mt-1">フロアにスペースを追加して、チームのオフィスを完成させます</p>
        </div>

        {/* Steps */}
        <div className="px-8 py-5 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
            <div>
              <div className="text-sm font-semibold text-gray-800">スペースの種類を選ぶ</div>
              <div className="text-xs text-gray-500">デスクエリア・会議室・ラウンジ・カフェから選択</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
            <div>
              <div className="text-sm font-semibold text-gray-800">席数やレイアウトを設定</div>
              <div className="text-xs text-gray-500">対面配置・片面配置など、チームに合った形を選べます</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
            <div>
              <div className="text-sm font-semibold text-gray-800">保存してチームに共有</div>
              <div className="text-xs text-gray-500">URLを共有するだけで、誰でもすぐに参加できます</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
          <button onClick={onSkip} className="flex-1 py-3 text-sm text-gray-400 hover:text-gray-600 rounded-xl transition-colors">
            あとで
          </button>
          <button onClick={onStartSetup} className="flex-[2] py-3 bg-sky-500 hover:bg-sky-400 text-white font-semibold text-sm rounded-xl transition-all hover:shadow-lg flex items-center justify-center gap-2">
            <span>スペースを追加する</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
