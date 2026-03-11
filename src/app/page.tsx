import { auth } from "../../auth"
import { DashboardGrid } from "@/components/dashboard/DashboardGrid"

export default async function DashboardPage() {
  const session = await auth()
  const isLoggedIn = !!session?.user?.id

  return <DashboardGrid isLoggedIn={isLoggedIn} />
}
