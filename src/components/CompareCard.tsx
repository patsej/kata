import type { Pose } from '../data/poses'
import { Figure } from '../figure/Figure'
import { href } from '../router'
import { Icon } from './Icon'
import { categoryLabel } from './PoseCard'

/** The classic mistake next to the pose that corrects it. */
export function CompareCard({ pose, linked = false, heading }: { pose: Pose; linked?: boolean; heading?: string }) {
  const { mistake } = pose
  return (
    <article className="compare">
      {heading && <h2 className="compare__heading">{heading}</h2>}
      {linked && <span className="eyebrow">{categoryLabel(pose.category)}</span>}
      {linked && <h3 className="compare__title">{mistake.title}</h3>}
      <div className="compare__pair">
        <figure className="compare__side compare__side--bad">
          <span className="compare__tag">
            <Icon name="cross" size={14} /> À éviter
          </span>
          <Figure illustration={mistake.illustration} annotated={false} tone="mistake" title={`À éviter : ${mistake.title}`} />
          <figcaption>{mistake.title}</figcaption>
        </figure>
        <span className="compare__arrow" aria-hidden="true">
          <Icon name="next" size={18} />
        </span>
        <figure className="compare__side compare__side--good">
          <span className="compare__tag">
            <Icon name="check" size={14} /> La correction
          </span>
          <Figure illustration={pose.illustration} annotated={false} title={pose.name} />
          <figcaption>{pose.name}</figcaption>
        </figure>
      </div>
      <dl className="compare__text">
        <div>
          <dt>Le problème</dt>
          <dd>{mistake.caption}</dd>
        </div>
        <div>
          <dt>La correction</dt>
          <dd>{pose.summary}</dd>
        </div>
      </dl>
      {linked && (
        <a className="compare__link" href={href('poses', pose.id)}>
          Apprendre « {pose.name} » <Icon name="next" size={16} />
        </a>
      )}
    </article>
  )
}
