import React from "react";

export interface DebateTopic {
  key: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface DebateTopicSelectorProps {
  topics: DebateTopic[];
  selected: string | null;
  onSelect: (key: string) => void;
}

const DebateTopicSelector: React.FC<DebateTopicSelectorProps> = ({ topics, selected, onSelect }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-5xl">
      {topics.map((topic) => (
        <button
          key={topic.key}
          onClick={() => onSelect(topic.key)}
          className={`bg-[#232b39] rounded-xl p-8 flex flex-col items-center shadow-lg border-2 transition-all duration-200 ${selected === topic.key ? 'border-blue-400' : 'border-transparent'} hover:border-blue-400`}
        >
          <div className="text-4xl mb-4">{topic.icon}</div>
          <h3 className="text-xl font-bold text-white mb-2">{topic.title}</h3>
          <p className="text-gray-300 text-center">{topic.description}</p>
        </button>
      ))}
    </div>
  );
};

export default DebateTopicSelector; 