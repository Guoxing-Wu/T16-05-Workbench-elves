

export function PlaceholderPage({ eyebrow, title, icon: Icon, description }: {
  eyebrow: string
  title: string
  icon: React.ElementType
  description: string
}) {
  return (
    <div className="placeholder-hero">
      <div className="placeholder-icon"><Icon size={28}/></div>
      <div className="placeholder-eyebrow">{eyebrow}</div>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  )
}
