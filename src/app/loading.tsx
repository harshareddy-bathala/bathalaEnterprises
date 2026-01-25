export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-16 w-16">
          <div className="absolute h-16 w-16 rounded-full border-4 border-royal/20" />
          <div className="absolute h-16 w-16 animate-spin rounded-full border-4 border-transparent border-t-royal" />
        </div>
        <p className="text-sm font-medium text-slateInk animate-pulse">Loading...</p>
      </div>
    </div>
  );
}
