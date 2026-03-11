import { auth } from "../../auth"
import { DashboardGrid } from "@/components/dashboard/DashboardGrid"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const session = await auth()
  const isLoggedIn = !!session?.user?.id

  return <DashboardGrid isLoggedIn={isLoggedIn} />
}
