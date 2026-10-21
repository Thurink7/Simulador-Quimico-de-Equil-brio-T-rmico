# ThermoLab

Laboratório virtual de trocas de calor para ensino de Termodinâmica.

## Stack

- React + TypeScript + Vite
- SceneryStack para a bancada interativa
- Modelo de calorimetria em `src/physics`

## Como executar

```bash
npm install
npm run dev
```

## Modelo físico

A temperatura de equilíbrio de corpos em contacto térmico é

`T_e = (Σ m_i c_i T_i) / (Σ m_i c_i)`

O calor transferido apresentado é `|m₁ c₁ (T_e − T₁)|`.

Água e óleo não se misturam. Sólidos podem ser colocados em contacto térmico com líquidos sem formar uma mistura homogénea.
