export default function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
      {/* Image placeholder */}
      <div className="aspect-[4/3] bg-slate-200" />
      {/* Content */}
      <div className="p-4 space-y-3">
        <div className="h-4 bg-slate-200 rounded w-3/4" />
        <div className="h-3 bg-slate-200 rounded w-1/2" />
        <div className="h-5 bg-slate-200 rounded w-2/3 mt-2" />
        <div className="h-9 bg-slate-100 rounded-xl mt-3" />
      </div>
    </div>
  );
}
