import { Circle, Node } from 'scenerystack/scenery'

interface Particle {
  node: Circle
  life: number
  offset: number
}

export class ParticleSystem {
  readonly node: Node
  private readonly particles: Particle[] = []
  private time = 0

  constructor(count = 16) {
    this.node = new Node({ pickable: false })
    for (let i = 0; i < count; i += 1) {
      const circle = new Circle(2.4, {
        fill: 'rgba(255,255,255,0.78)',
        stroke: '#f97316',
        lineWidth: 1.3,
        opacity: 0,
      })
      this.particles.push({
        node: circle,
        life: i / count,
        offset: (i / count) * Math.PI * 2,
      })
      this.node.addChild(circle)
    }
  }

  step(
    dt: number,
    active: boolean,
    originX: number,
    originY: number,
    targetX: number,
    targetY: number,
    color: string,
  ): void {
    if (!active) {
      for (const particle of this.particles) {
        particle.node.opacity = 0
      }
      return
    }

    this.time += dt
    const dx = targetX - originX
    const dy = targetY - originY

    for (const particle of this.particles) {
      particle.life = (particle.life + dt * 0.45) % 1
      const wobble = Math.sin(this.time * 3 + particle.offset) * 10
      const px = originX + dx * particle.life + wobble * 0.35
      const py = originY + dy * particle.life - particle.life * 18
      particle.node.x = px
      particle.node.y = py
      particle.node.fill = color
      particle.node.opacity = 0.15 + 0.7 * Math.sin(particle.life * Math.PI)
    }
  }

  dispose(): void {
    this.node.removeAllChildren()
  }
}
