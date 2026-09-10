import { HomeListSkeleton, HomeStatsSkeleton } from "@/components/skeletons";

export default function HomeLoading() {
  return (
    <>
      <HomeStatsSkeleton />
      <HomeListSkeleton />
    </>
  );
}
