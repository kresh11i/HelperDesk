import React, { useState } from 'react';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import { Search, Book, FileText, ExternalLink } from 'lucide-react';

function KnowledgeBase() {
  const [search, setSearch] = useState('');

  const articles = [
    { id: 1, title: 'How to reset your corporate password', category: 'Accounts', readTime: '3 min read' },
    { id: 2, title: 'Connecting to the company VPN (Windows/Mac)', category: 'Network', readTime: '5 min read' },
    { id: 3, title: 'Requesting a new software license', category: 'Software', readTime: '2 min read' },
    { id: 4, title: 'Troubleshooting email sync issues on mobile', category: 'Mobile', readTime: '4 min read' },
    { id: 5, title: 'Setting up your desk phone and voicemail', category: 'Hardware', readTime: '6 min read' },
    { id: 6, title: 'Using the new Helpdesk portal', category: 'General', readTime: '3 min read' },
  ];

  const filteredArticles = articles.filter(a => a.title.toLowerCase().includes(search.toLowerCase()) || a.category.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col gap-6 pb-8 h-full pt-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div>
          <h2 className="text-[10px] font-bold tracking-widest text-neutral-500 uppercase mb-1">Self-Service</h2>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Knowledge Base</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input 
              type="text"
              placeholder="Search articles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-white/30 focus:bg-white/10 transition-colors w-full md:w-80"
            />
          </div>
        </div>
      </div>

      {/* Featured/Categories */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
        {['Accounts', 'Network', 'Software', 'Hardware'].map(cat => (
          <GlassCard key={cat} level={2} className="p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/10 transition-colors">
            <Book className="w-6 h-6 text-neutral-400 mb-2" />
            <span className="text-sm font-medium text-white">{cat}</span>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredArticles.length === 0 ? (
          <div className="col-span-full text-center text-neutral-500 py-10">No articles found matching "{search}".</div>
        ) : (
          filteredArticles.map((article) => (
            <GlassCard key={article.id} level={1} className="p-6 flex flex-col justify-between group cursor-pointer hover:bg-white/10 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold tracking-widest uppercase bg-white/10 text-neutral-300 border border-white/10">
                    {article.category}
                  </div>
                  <FileText className="w-4 h-4 text-neutral-500" />
                </div>
                <h3 className="text-lg font-medium text-white group-hover:text-neutral-200 mb-2 line-clamp-2">{article.title}</h3>
              </div>
              
              <div className="flex items-center justify-between mt-6">
                <span className="text-xs text-neutral-500">{article.readTime}</span>
                <span className="text-xs text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  Read article <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </div>
  );
}

export default KnowledgeBase;
