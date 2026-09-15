### E2E Tests: Immersive Accessible Portfolio

**Suite ID:** `PORTFOLIO-E2E`
**Feature:** Accessible seal shell, Main Hall unlock flow, system motion preferences, TCG-like project cards, and package/security guardrails.

---

## Test Case: `PORTFOLIO-E2E-001` - Continuous vault first frame

**Priority:** `critical`
**Tags:** @e2e, @portfolio, @critical

**Objective:** Verify the route opens into the vault shell with semantic first-frame content.

**Flow Steps:**
1. Open `/`.
2. Locate the shell by role/name.
3. Verify the intro title and accessible navigation status.

**Expected Result:** The page exposes a continuous vault shell without depending on a visible scrollbar cue.

---

## Test Case: `PORTFOLIO-E2E-002` - Seal keyboard and control parity

**Priority:** `high`
**Tags:** @e2e, @portfolio, @a11y

**Objective:** Confirm seal hotspots, controls, and keyboard inputs produce equivalent state movement, meaningful focus, and no visible internal project mapping.

**Flow Steps:**
1. Open the seal interface with keyboard input.
2. Verify the active seal heading receives focus and the first hotspot is unlocked.
3. Verify `Conecta con` and `marca` are not visible.
4. Move forward and backward between seals with arrow keys and check `Desbloqueado X/3` progress.

**Expected Result:** Active semantic regions change consistently and focus remains visible.

---

## Test Case: `PORTFOLIO-E2E-009` - Vault door seal hotspots

**Priority:** `critical`
**Tags:** @e2e, @portfolio

**Objective:** Verify visitors can unlock the three glowing vault-door seals and enter the construction hall through the approved CTA.

**Flow Steps:**
1. Emulate reduced motion.
2. Open the seal interface.
3. Click the second and third seal hotspots.
4. Verify progress reaches `Desbloqueado 3/3`.
5. Activate `Mis obras en construcción`.

**Expected Result:** The Main Hall landmark receives focus after hotspot unlocking.

---

## Test Case: `PORTFOLIO-E2E-003` - Reduced motion

**Priority:** `critical`
**Tags:** @e2e, @a11y, @motion

**Objective:** Verify the system reduced-motion preference keeps the vault path functional without exposing obsolete motion controls.

**Flow Steps:**
1. Emulate reduced motion.
2. Open `/` and verify seal guidance and the absence of visible pause or motion-preference controls.
3. Advance through the seal path.

**Expected Result:** Reduced motion is honored through the system preference, and no obsolete visible pause or reduced-motion controls are rendered.

---

## Test Case: `PORTFOLIO-E2E-005` - Keyboard unlock to Main Hall

**Priority:** `critical`
**Tags:** @e2e, @a11y, @portfolio

**Objective:** Verify keyboard-only visitors can unlock the vault and land on the Main Hall landmark.

**Flow Steps:**
1. Open `/`.
2. Advance through all three vault seals with keyboard input.
3. Verify Main Hall receives visible focus and shows the visible project set.

**Expected Result:** Focus lands on `Sala principal de proyectos`, and visible projects explain the portfolio without hidden chambers.

---

## Test Case: `PORTFOLIO-E2E-006` - Desktop scroll guidance

**Priority:** `critical`
**Tags:** @e2e, @portfolio

**Objective:** Verify the first frame exposes scroll as a supported desktop input channel.

**Flow Steps:**
1. Open `/`.
2. Verify the intro heading remains available.
3. Verify the accessible status announces scroll and arrow-key guidance.

**Expected Result:** Desktop visitors get a non-visual cue that scroll is supported.

---

## Test Case: `PORTFOLIO-E2E-007` - Reduced-motion unlock path

**Priority:** `critical`
**Tags:** @e2e, @a11y, @motion

**Objective:** Verify the static reduced-motion path can still unlock the portfolio.

**Flow Steps:**
1. Emulate reduced motion.
2. Open `/`.
3. Advance through all seals with keyboard input.

**Expected Result:** Main Hall appears and receives focus without requiring motion.

---

## Test Case: `PORTFOLIO-E2E-008` - Accessible project card flip

**Priority:** `critical`
**Tags:** @e2e, @a11y, @portfolio

**Objective:** Verify the visible project set renders and one TCG-like card exposes its back face through an explicit control.

**Flow Steps:**
1. Emulate reduced motion.
2. Unlock the Main Hall through the seal path.
3. Verify visible project headings and activate `Ver reverso` on the Timer card.

**Expected Result:** The card control exposes expanded state and the Timer back-face payoff appears without relying on hover.

---

## Test Case: `PORTFOLIO-E2E-004` - Security guardrails

**Priority:** `medium`
**Tags:** @e2e, @security

**Objective:** Keep pnpm-only and localhost-only development constraints review-visible.

**Flow Steps:**
1. Read the project manifest from the test runner.
2. Verify pnpm and localhost dev-server settings.
3. Check that a common automation endpoint is not publicly served.

**Expected Result:** Package-manager and automation-exposure requirements are enforced where feasible.
