import { IdeaDetailClient } from "./IdeaDetailClient"

interface IdeaDetailPageProps {
  readonly params: Promise<{ readonly id: string }>
}

export async function generateMetadata({ params }: IdeaDetailPageProps) {
  const { id } = await params
  return {
    title: `아이디어 ${id} - InvestHub`,
  }
}

export default async function IdeaDetailPage({ params }: IdeaDetailPageProps) {
  const { id } = await params

  return (
    <div className="space-y-6">
      <IdeaDetailClient ideaId={id} />
    </div>
  )
}
