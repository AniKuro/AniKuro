import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Flame, TrendingUp, Star, Calendar, Sparkles, Filter, X, Tv, BookOpen, ArrowLeft } from 'lucide-react';
import { AnimeMedia } from '../../types/anime';
import { UserTrackEntry, TitleLanguage } from '../../types/userList';
import { anilistApi, AniListSearchFilters } from '../../services/anilistApi';
import { useDebounce } from '../../hooks/useDebounce';
import { HeroSpotlight } from './HeroSpotlight';
import { AnimeCarousel } from './AnimeCarousel';
import { AnimeCard } from './AnimeCard';
import { KUROSENSEI_AI_BASE64 } from '../../assets/logoBase64';
import { useDragToScroll } from '../../hooks/useDragToScroll';
import { useBackHandler } from '../../services/backHandler';

const GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mecha',
  'Music', 'Mystery', 'Psychological', 'Romance', 'Sci-Fi', 'Slice of Life',
  'Sports', 'Supernatural', 'Thriller'
];

interface DiscoverScreenProps {
  userEntries: UserTrackEntry[];
  titleLanguage: TitleLanguage;
  onSelectAnime: (anime: AnimeMedia) => void;
  onQuickTrack: (anime: AnimeMedia) => void;
  onPlayTrailer?: (trailerId: string) => void;
  onOpenAiSensei?: () => void;
}

export const DiscoverScreen: React.FC<DiscoverScreenProps> = ({
  userEntries,
  titleLanguage,
  onSelectAnime,
  onQuickTrack,
  onPlayTrailer,
  onOpenAiSensei,
}) => {
  const [trending, setTrending] = useState<AnimeMedia[]>([]);
  const [popularSeason, setPopularSeason] = useState<AnimeMedia[]>([]);
  const [topRated, setTopRated] = useState<AnimeMedia[]>([]);
  const [upcoming, setUpcoming] = useState<AnimeMedia[]>([]);
  const [isLoadingFeeds, setIsLoadingFeeds] = useState(true);

  const [filters, setFilters] = useState<AniListSearchFilters>({
    type: 'ANIME',
    search: '',
    genre: '',
    format: '',
    status: '',
    season: '',
    seasonYear: '',
    sort: 'TRENDING_DESC',
    page: 1,
  });

  const handleTypeChange = (newType: 'ANIME' | 'MANGA') => {
    if (filters.type === newType) return;
    setFilters((prev) => ({
      ...prev,
      type: newType,
      format: '',
      season: newType === 'MANGA' ? '' : prev.season,
      seasonYear: newType === 'MANGA' ? '' : prev.seasonYear,
      page: 1,
    }));
  };

  const debouncedSearch = useDebounce(filters.search, 400);

  const [searchResults, setSearchResults] = useState<AnimeMedia[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasNextSearchPage, setHasNextSearchPage] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const isSearchActive = isSearchExpanded || Boolean(filters.search);

  // Back button handling: Close filters modal first, or collapse search
  useBackHandler(showFiltersModal, () => setShowFiltersModal(false), 20);
  useBackHandler(isSearchExpanded, () => {
    setIsSearchExpanded(false);
    if (filters.search) {
      setFilters((prev) => ({ ...prev, search: '' }));
    }
  }, 15);

  const isFiltering = Boolean(
    debouncedSearch ||
      filters.genre ||
      filters.format ||
      filters.status ||
      filters.season ||
      filters.seasonYear ||
      filters.sort !== 'TRENDING_DESC' ||
      filters.type === 'MANGA'
  );

  const loadDiscoveryFeeds = useCallback(async () => {
    setIsLoadingFeeds(true);
    try {
      const [trendRes, popSeasonRes, topRes, upRes] = await Promise.all([
        anilistApi.getTrending(1, 16),
        anilistApi.getPopularThisSeason(1, 16),
        anilistApi.getTopRated(1, 16),
        anilistApi.getUpcomingNextSeason(1, 16),
      ]);
      setTrending(trendRes.media);
      setPopularSeason(popSeasonRes.media);
      setTopRated(topRes.media);
      setUpcoming(upRes.media);
    } catch (err) {
      console.error('Failed to load discovery feeds:', err);
    } finally {
      setIsLoadingFeeds(false);
    }
  }, []);

  useEffect(() => {
    loadDiscoveryFeeds();
  }, [loadDiscoveryFeeds]);

  const executeSearch = useCallback(async (isLoadMore = false) => {
    setIsSearching(true);
    try {
      const currentPage = isLoadMore ? (filters.page || 1) + 1 : 1;
      const res = await anilistApi.search({
        ...filters,
        search: debouncedSearch,
        page: currentPage,
        perPage: 32,
      });

      if (isLoadMore) {
        setSearchResults((prev) => [...prev, ...res.media]);
        setFilters((prev) => ({ ...prev, page: currentPage }));
      } else {
        setSearchResults(res.media);
        setFilters((prev) => ({ ...prev, page: 1 }));
      }
      setHasNextSearchPage(res.pageInfo?.hasNextPage || false);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  }, [filters, debouncedSearch]);

  useEffect(() => {
    if (isFiltering) {
      executeSearch(false);
    }
  }, [
    debouncedSearch,
    filters.type,
    filters.genre,
    filters.format,
    filters.status,
    filters.season,
    filters.seasonYear,
    filters.sort,
  ]);

  const resetFilters = () => {
    setFilters({
      type: 'ANIME',
      search: '',
      genre: '',
      format: '',
      status: '',
      season: '',
      seasonYear: '',
      sort: 'TRENDING_DESC',
      page: 1,
    });
    setSearchResults([]);
  };

  const { dragProps: genreDragProps, isDragging: isDraggingGenres } = useDragToScroll();

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-[1920px] mx-auto px-3 sm:px-8 lg:px-12 py-3 sm:py-4">
      {/* Desktop Search Bar & Media Type Switcher */}
      <div className="hidden sm:flex items-center gap-3">
        {/* Anime / Manga Switcher Toggle */}
        <div className="flex items-center p-1 rounded-2xl glass-card border border-[var(--border-color)] shadow-sm bg-[var(--bg-secondary)]/60 shrink-0">
          <button
            type="button"
            onClick={() => handleTypeChange('ANIME')}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              (filters.type || 'ANIME') === 'ANIME'
                ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/25'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-sky-500/5'
            }`}
          >
            <Tv size={14} />
            <span>Anime</span>
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('MANGA')}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              filters.type === 'MANGA'
                ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/25'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-sky-500/5'
            }`}
          >
            <BookOpen size={14} />
            <span>Manga</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
            placeholder={
              filters.type === 'MANGA'
                ? 'Search manga by title, author, or keywords...'
                : 'Search anime by title, English, or keywords...'
            }
            className="w-full pl-11 pr-10 py-3 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-sky-500 shadow-sm transition-colors"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => setFilters({ ...filters, search: '', page: 1 })}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Filter Toggle */}
        <button
          type="button"
          onClick={() => setShowFiltersModal(!showFiltersModal)}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl border text-xs font-black transition-all shrink-0 cursor-pointer ${
            showFiltersModal || filters.genre || filters.format || filters.status || filters.season || filters.sort !== 'TRENDING_DESC'
              ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-md shadow-sky-500/25'
              : 'glass-panel text-[var(--text-secondary)] border-[var(--border-color)] hover:bg-sky-500/10'
          }`}
        >
          <Filter size={15} />
          <span>Filters</span>
        </button>
      </div>

      {/* Mobile Expandable Search Bar & Media Type Controls */}
      <div className="sm:hidden flex flex-col gap-2">
        {!isSearchActive ? (
          /* Collapsed State: Clean row with Switcher, Expandable Search Trigger, and Filter */
          <div className="flex items-center gap-2 w-full animate-fade-in">
            {/* Compact Anime / Manga Switcher Toggle */}
            <div className="flex items-center p-0.5 rounded-xl glass-card border border-[var(--border-color)] shadow-sm bg-[var(--bg-secondary)]/60 shrink-0">
              <button
                type="button"
                onClick={() => handleTypeChange('ANIME')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  (filters.type || 'ANIME') === 'ANIME'
                    ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Tv size={13} />
                <span>Anime</span>
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('MANGA')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  filters.type === 'MANGA'
                    ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <BookOpen size={13} />
                <span>Manga</span>
              </button>
            </div>

            {/* Expandable Search Button Trigger */}
            <button
              type="button"
              onClick={() => {
                setIsSearchExpanded(true);
                setTimeout(() => mobileSearchInputRef.current?.focus(), 60);
              }}
              className="flex items-center gap-2 flex-1 min-w-0 px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-sky-500/50 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all cursor-pointer shadow-sm active:scale-98"
            >
              <Search size={15} className="text-sky-400 shrink-0" />
              <span className="text-xs font-semibold truncate">
                Search {filters.type === 'MANGA' ? 'manga...' : 'anime...'}
              </span>
            </button>

            {/* Filter Button */}
            <button
              type="button"
              onClick={() => setShowFiltersModal(!showFiltersModal)}
              className={`p-2.5 rounded-xl border text-xs font-black transition-all shrink-0 cursor-pointer ${
                showFiltersModal || filters.genre || filters.format || filters.status || filters.season || filters.sort !== 'TRENDING_DESC'
                  ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-md shadow-sky-500/25'
                  : 'glass-panel text-[var(--text-secondary)] border-[var(--border-color)] hover:bg-sky-500/10'
              }`}
              title="Search Filters"
            >
              <Filter size={15} />
            </button>
          </div>
        ) : (
          /* Expanded Full-Width Search State */
          <div className="flex flex-col gap-2 w-full animate-fade-in">
            <div className="flex items-center gap-2 w-full">
              {/* Collapse / Back Button */}
              <button
                type="button"
                onClick={() => {
                  setIsSearchExpanded(false);
                  setFilters((prev) => ({ ...prev, search: '', page: 1 }));
                }}
                className="p-2.5 rounded-xl glass-card border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-sky-400 active:scale-95 transition-all shrink-0 cursor-pointer shadow-sm"
                title="Collapse search"
              >
                <ArrowLeft size={17} />
              </button>

              {/* Full-Width Search Input */}
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sky-400" />
                <input
                  ref={mobileSearchInputRef}
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                  placeholder={
                    filters.type === 'MANGA'
                      ? 'Search manga by title, author...'
                      : 'Search anime by title, English, or keywords...'
                  }
                  className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-sky-500 ring-2 ring-sky-500/20 text-xs sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-sky-400 shadow-sm transition-colors"
                  autoFocus
                />
                {filters.search && (
                  <button
                    type="button"
                    onClick={() => {
                      setFilters({ ...filters, search: '', page: 1 });
                      mobileSearchInputRef.current?.focus();
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              {/* Filter Button */}
              <button
                type="button"
                onClick={() => setShowFiltersModal(!showFiltersModal)}
                className={`p-2.5 rounded-xl border text-xs font-black transition-all shrink-0 cursor-pointer ${
                  showFiltersModal || filters.genre || filters.format || filters.status || filters.season || filters.sort !== 'TRENDING_DESC'
                    ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-md shadow-sky-500/25'
                    : 'glass-panel text-[var(--text-secondary)] border-[var(--border-color)] hover:bg-sky-500/10'
                }`}
                title="Search Filters"
              >
                <Filter size={16} />
              </button>
            </div>

            {/* Quick Media Type Switcher & Active Status Sub-bar */}
            <div className="flex items-center justify-between gap-2 pt-0.5 animate-fade-in">
              <div className="flex items-center p-0.5 rounded-xl glass-card border border-[var(--border-color)] shadow-sm bg-[var(--bg-secondary)]/70">
                <button
                  type="button"
                  onClick={() => handleTypeChange('ANIME')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    (filters.type || 'ANIME') === 'ANIME'
                      ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-sm'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Tv size={12} />
                  <span>Anime</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('MANGA')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    filters.type === 'MANGA'
                      ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-sm'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <BookOpen size={12} />
                  <span>Manga</span>
                </button>
              </div>

              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-[var(--text-muted)] font-medium">
                  Searching <strong className="text-sky-400 font-bold">{filters.type === 'MANGA' ? 'Manga' : 'Anime'}</strong>
                </span>
                {filters.search && (
                  <button
                    type="button"
                    onClick={() => {
                      setFilters((prev) => ({ ...prev, search: '', page: 1 }));
                      setIsSearchExpanded(false);
                    }}
                    className="text-sky-400 hover:text-sky-300 font-bold underline cursor-pointer"
                  >
                    Clear & Exit
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Slide-Down Filter Options Panel */}
      {showFiltersModal && (
        <div className="p-4 rounded-2xl glass-card border border-sky-400/40 shadow-xl space-y-3.5 animate-slide-up">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)]">
            <h4 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-1.5">
              <Filter size={14} className="text-sky-500" />
              <span>Advanced Search Filters</span>
            </h4>
            <button
              onClick={resetFilters}
              className="text-[11px] font-bold text-sky-500 hover:underline cursor-pointer"
            >
              Reset All
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
            {/* Media Type Filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Media Type</label>
              <select
                value={filters.type || 'ANIME'}
                onChange={(e) => handleTypeChange(e.target.value as 'ANIME' | 'MANGA')}
                className="w-full p-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-sky-500"
              >
                <option value="ANIME">Anime</option>
                <option value="MANGA">Manga</option>
              </select>
            </div>

            {/* Format Filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Format</label>
              <select
                value={filters.format || ''}
                onChange={(e) => setFilters({ ...filters, format: e.target.value, page: 1 })}
                className="w-full p-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-sky-500"
              >
                <option value="">All Formats</option>
                {filters.type === 'MANGA' ? (
                  <>
                    <option value="MANGA">Manga</option>
                    <option value="NOVEL">Light Novel</option>
                    <option value="ONE_SHOT">One-Shot</option>
                  </>
                ) : (
                  <>
                    <option value="TV">TV Show</option>
                    <option value="TV_SHORT">TV Short</option>
                    <option value="MOVIE">Movie</option>
                    <option value="OVA">OVA</option>
                    <option value="ONA">ONA (Web)</option>
                    <option value="SPECIAL">Special</option>
                  </>
                )}
              </select>
            </div>

            {/* Status Filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Status</label>
              <select
                value={filters.status || ''}
                onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                className="w-full p-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-sky-500"
              >
                <option value="">All Statuses</option>
                <option value="RELEASING">{filters.type === 'MANGA' ? 'Currently Publishing' : 'Currently Airing'}</option>
                <option value="FINISHED">{filters.type === 'MANGA' ? 'Finished Publishing' : 'Finished Airing'}</option>
                <option value="NOT_YET_RELEASED">Upcoming</option>
              </select>
            </div>

            {/* Season Filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase">
                {filters.type === 'MANGA' ? 'Season (N/A)' : 'Season'}
              </label>
              <select
                value={filters.season || ''}
                disabled={filters.type === 'MANGA'}
                onChange={(e) => setFilters({ ...filters, season: e.target.value, page: 1 })}
                className="w-full p-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-sky-500 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <option value="">{filters.type === 'MANGA' ? 'Not Applicable' : 'All Seasons'}</option>
                <option value="WINTER">Winter</option>
                <option value="SPRING">Spring</option>
                <option value="SUMMER">Summer</option>
                <option value="FALL">Fall</option>
              </select>
            </div>

            {/* Sort Order */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Sort By</label>
              <select
                value={filters.sort || 'TRENDING_DESC'}
                onChange={(e) => setFilters({ ...filters, sort: e.target.value, page: 1 })}
                className="w-full p-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-sky-500"
              >
                <option value="TRENDING_DESC">Trending Now</option>
                <option value="POPULARITY_DESC">Most Popular</option>
                <option value="SCORE_DESC">Highest Rated</option>
                <option value="START_DATE_DESC">{filters.type === 'MANGA' ? 'Recently Published' : 'Recently Released'}</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Genre Filter Pills (Swipeable / Draggable) */}
      <div
        {...genreDragProps}
        className="flex gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5 select-none cursor-grab active:cursor-grabbing scroll-smooth"
      >
        <button
          onClick={() => {
            if (!isDraggingGenres) setFilters({ ...filters, genre: '' });
          }}
          className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
            !filters.genre ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20' : 'glass-card text-[var(--text-secondary)] border border-[var(--border-color)] hover:border-sky-400/50 hover:bg-sky-500/5'
          }`}
        >
          All Genres
        </button>
        {GENRES.map((g) => (
          <button
            key={g}
            onClick={() => {
              if (!isDraggingGenres) setFilters({ ...filters, genre: filters.genre === g ? '' : g });
            }}
            className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-all shrink-0 cursor-pointer ${
              filters.genre === g
                ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-md shadow-sky-500/20'
                : 'glass-card text-[var(--text-secondary)] border border-[var(--border-color)] hover:border-sky-400/50 hover:bg-sky-500/5'
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      {/* Search Grid Results View */}
      {isFiltering ? (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-[var(--text-primary)]">
                {isSearching
                  ? 'Searching...'
                  : debouncedSearch
                  ? `${filters.type === 'MANGA' ? 'Manga' : 'Anime'} Results for "${debouncedSearch}" (${searchResults.length})`
                  : `${filters.type === 'MANGA' ? 'Trending Manga' : 'Search Results'} (${searchResults.length})`}
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {filters.type === 'MANGA' ? 'Showing manga & light novels' : 'Showing anime series & movies'}
              </p>
            </div>
            <button onClick={resetFilters} className="text-xs font-bold text-sky-500 hover:underline cursor-pointer">
              Clear All Filters
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 3xl:grid-cols-8 gap-4 sm:gap-5">
            {searchResults.map((anime) => {
              const userEntry = userEntries.find((e) => e.animeId === anime.id);
              return (
                <AnimeCard
                  key={anime.id}
                  anime={anime}
                  userEntry={userEntry}
                  titleLanguage={titleLanguage}
                  isGrid={true}
                  onSelect={onSelectAnime}
                  onQuickTrack={(e, a) => {
                    e.stopPropagation();
                    onQuickTrack(a);
                  }}
                />
              );
            })}
          </div>

          {hasNextSearchPage && (
            <div className="flex justify-center pt-6">
              <button
                onClick={() => executeSearch(true)}
                disabled={isSearching}
                className="px-8 py-3 rounded-2xl glass-card border border-[var(--border-color)] hover:bg-sky-500/10 text-xs font-black text-sky-500 shadow-md active:scale-95 transition-all"
              >
                {isSearching ? 'Loading More...' : 'Load More Results'}
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Discovery Main Feeds */
        <div className="space-y-9">
          {/* Spotlight Hero Banner */}
          <HeroSpotlight
            animeList={trending.slice(0, 5)}
            userEntries={userEntries}
            titleLanguage={titleLanguage}
            onSelect={onSelectAnime}
            onTrack={onQuickTrack}
            onPlayTrailer={onPlayTrailer}
          />

          {/* KuroSensei AI Banner */}
          {onOpenAiSensei && (
            <div
              onClick={onOpenAiSensei}
              className="kurosensei-ai-banner p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-sky-950/90 via-slate-900 to-indigo-950/90 border border-sky-400/40 shadow-xl shadow-sky-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 cursor-pointer hover:border-sky-400 active:scale-[0.99] transition-all group"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl overflow-hidden shadow-lg shadow-sky-500/30 border-2 border-sky-400/60 shrink-0 bg-slate-950 group-hover:scale-105 transition-transform">
                  <img src={KUROSENSEI_AI_BASE64} alt="KuroSensei AI" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <h4 className="text-xs sm:text-base font-black text-white">Ask KuroSensei AI Oracle</h4>
                    <span className="text-[9px] sm:text-[10px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded bg-sky-500/20 text-sky-500 dark:text-sky-300 border border-sky-500/30">
                      Neural Matchmaker
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-sm text-slate-300 mt-0.5 sm:mt-1 line-clamp-2">
                    Get tailored anime recommendations & hidden gems computed from your personal watch history
                  </p>
                </div>
              </div>

              <span className="w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-slate-950 font-black text-xs shadow-lg flex items-center justify-center gap-1.5 shrink-0 group-hover:scale-105 transition-transform">
                <Sparkles size={13} className="fill-slate-950" />
                <span>Try KuroSensei AI</span>
              </span>
            </div>
          )}

          {/* Trending Now */}
          <AnimeCarousel
            title="Trending Now"
            subtitle="Most popular anime this week across the community"
            icon={<Flame size={20} />}
            animeList={trending}
            userEntries={userEntries}
            titleLanguage={titleLanguage}
            onSelect={onSelectAnime}
            onQuickTrack={(e, a) => {
              e.stopPropagation();
              onQuickTrack(a);
            }}
            isLoading={isLoadingFeeds}
          />

          {/* Popular This Season */}
          <AnimeCarousel
            title="Popular This Season"
            subtitle="Top airing series this broadcast cycle"
            icon={<TrendingUp size={20} />}
            animeList={popularSeason}
            userEntries={userEntries}
            titleLanguage={titleLanguage}
            onSelect={onSelectAnime}
            onQuickTrack={(e, a) => {
              e.stopPropagation();
              onQuickTrack(a);
            }}
            isLoading={isLoadingFeeds}
          />

          {/* All-Time Top Rated */}
          <AnimeCarousel
            title="All-Time Masterpieces"
            subtitle="Highest critically acclaimed anime of all time"
            icon={<Star size={20} />}
            animeList={topRated}
            userEntries={userEntries}
            titleLanguage={titleLanguage}
            onSelect={onSelectAnime}
            onQuickTrack={(e, a) => {
              e.stopPropagation();
              onQuickTrack(a);
            }}
            isLoading={isLoadingFeeds}
          />

          {/* Upcoming Next Season */}
          <AnimeCarousel
            title="Upcoming Next Season"
            subtitle="Anticipated upcoming releases and franchise sequels"
            icon={<Calendar size={20} />}
            animeList={upcoming}
            userEntries={userEntries}
            titleLanguage={titleLanguage}
            onSelect={onSelectAnime}
            onQuickTrack={(e, a) => {
              e.stopPropagation();
              onQuickTrack(a);
            }}
            isLoading={isLoadingFeeds}
          />
        </div>
      )}
    </div>
  );
};