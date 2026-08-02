import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import CandidateCard from './components/CandidateCard';
import CandidateModal from './components/CandidateModal';
import CompareMatrix from './components/CompareMatrix';
import DomainExplorer from './components/DomainExplorer';
import UserVoting from './components/UserVoting';
import DevOpenRouterStudio from './components/DevOpenRouterStudio';
import Footer from './components/Footer';

import staticModelsData from './data/modelsData.json';
import { getUserVotes, castVote, getCustomModels, saveCustomModel, fetchAggregateVotes, getUserVotedModel } from './services/storage';
import { isDevStudioAllowed } from './services/openRouterApi';

export default function App() {
  const [activeTab, setActiveTab] = useState('candidates'); // 'candidates' | 'compare' | 'domains' | 'voting'
  const [devMode, setDevMode] = useState(false);
  const [candidatesData, setCandidatesData] = useState([]);
  const [selectedCandidateModal, setSelectedCandidateModal] = useState(null);
  const [userVotes, setUserVotes] = useState({});
  const [userVotedModel, setUserVotedModel] = useState(null);

  // Initialize data on mount
  useEffect(() => {
    const customModels = getCustomModels();
    const merged = [...customModels, ...staticModelsData];
    setCandidatesData(merged);

    setUserVotedModel(getUserVotedModel());

    // Fetch live votes (from Neon Postgres, Vercel KV, or local storage)
    fetchAggregateVotes().then(initialVotes => {
      if (initialVotes) setUserVotes(initialVotes);
    });
  }, []);

  const handleVote = async (modelId) => {
    const res = await castVote(modelId);
    setUserVotes({ ...res.votes });
    setUserVotedModel(res.userVotedModel);
  };

  const handleAddCustomCandidate = (newCandidateData) => {
    const updatedCustom = saveCustomModel(newCandidateData);
    setCandidatesData([...updatedCustom, ...staticModelsData]);
    setActiveTab('candidates');
    setSelectedCandidateModal(newCandidateData);
  };

  const totalVotes = Object.values(userVotes).reduce((acc, v) => acc + v, 0);

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        devMode={isDevStudioAllowed && devMode}
        setDevMode={setDevMode}
        totalVotes={totalVotes}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        
        {/* Dev OpenRouter Studio Banner if toggled & allowed */}
        {isDevStudioAllowed && devMode && (
          <DevOpenRouterStudio
            candidatesData={candidatesData}
            onAddCustomCandidate={handleAddCustomCandidate}
          />
        )}

        {/* Tab 1: Candidates View */}
        {activeTab === 'candidates' && (
          <>
            <HeroSection candidateCount={candidatesData.length} />

            <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white font-rubik tracking-tight">
                    נבחרת המועמדים ({candidatesData.length} מודלי AI)
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    לחץ על כרטיס מועמד לצפייה במצע האופרטיבי המלא, 100 ימי פעילות, וביקורת עצמית
                  </p>
                </div>
                <div className="text-xs text-cyan-400 font-semibold bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-xl">
                  מחובר לנתוני אמת (Grounded)
                </div>
              </div>

              {/* Grid of Candidate Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {candidatesData.map(c => (
                  <CandidateCard
                    key={c.id}
                    candidateData={c}
                    onSelectCandidate={setSelectedCandidateModal}
                    onVote={handleVote}
                    userVotes={userVotes}
                    userVotedModel={userVotedModel}
                  />
                ))}
              </div>
            </section>
          </>
        )}

        {/* Tab 2: Compare Matrix View */}
        {activeTab === 'compare' && (
          <CompareMatrix candidatesData={candidatesData} />
        )}

        {/* Tab 3: Policy Domains View */}
        {activeTab === 'domains' && (
          <DomainExplorer
            candidatesData={candidatesData}
            onSelectCandidate={setSelectedCandidateModal}
          />
        )}

        {/* Tab 4: User Voting View */}
        {activeTab === 'voting' && (
          <UserVoting
            candidatesData={candidatesData}
            userVotes={userVotes}
            onVote={handleVote}
            userVotedModel={userVotedModel}
          />
        )}

      </main>

      {/* Candidate Platform Drawer / Modal */}
      {selectedCandidateModal && (
        <CandidateModal
          candidateData={selectedCandidateModal}
          onClose={() => setSelectedCandidateModal(null)}
          onVote={handleVote}
          userVotes={userVotes}
          userVotedModel={userVotedModel}
        />
      )}

      {/* Footer */}
      <Footer />

    </div>
  );
}
