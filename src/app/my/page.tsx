import { redirect } from "next/navigation"
import { auth } from "../../../auth"
import { MyPageClient } from "./MyPageClient"

export default async function MyPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  return <MyPageClient />
}
