"use client";

import { createPortal } from "react-dom";
import { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore, type MouseEvent, type ReactNode, type Ref } from "react";
import { handleSpaceActivation } from "../../shared/a11y/space-activation";
import { getFocusableElements } from "../../shared/a11y/modal-focus";

interface ExternalNavigationContextValue {
  requestNavigation: (url: string, invoker: HTMLAnchorElement, confirmationPurpose?: string) => void;
}

interface ExternalLinkProps {
  children: ReactNode;
  className?: string;
  confirmationPurpose?: string;
  href: string;
  ref?: Ref<HTMLAnchorElement>;
}

interface PendingNavigation {
  confirmationPurpose?: string;
  invoker: HTMLAnchorElement;
  url: string;
}

interface NavigationDescription {
  accessibleText: string;
  note: string;
  purpose: string;
}

const ExternalNavigationContext = createContext<ExternalNavigationContextValue | null>(null);

function getDestinationLabel(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function getNavigationDescription(url: string, confirmationPurpose?: string) {
  const purpose = confirmationPurpose ?? `Continuarás a ${getDestinationLabel(url)}`;
  const note = "(se abrirá en una pestaña nueva).";
  return { accessibleText: `${purpose} ${note}`, note, purpose } satisfies NavigationDescription;
}

export function ExternalNavigationProvider({ children }: { children: ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const continueRef = useRef<HTMLButtonElement>(null);
  const [pendingNavigation, setPendingNavigation] = useState<PendingNavigation | null>(null);
  const isMounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return;
    if (pendingNavigation !== null && !dialog.open) {
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
      window.requestAnimationFrame(() => cancelRef.current?.focus({ preventScroll: true }));
    } else if (pendingNavigation === null && dialog.open) {
      if (typeof dialog.close === "function") dialog.close();
      else dialog.removeAttribute("open");
    }
  }, [pendingNavigation]);

  function closeDialog() {
    const invoker = pendingNavigation?.invoker;
    setPendingNavigation(null);
    window.requestAnimationFrame(() => invoker?.focus({ preventScroll: true }));
  }

  function continueNavigation() {
    const url = pendingNavigation?.url;
    if (url === undefined) return;
    const destination = window.open(url, "_blank", "noopener,noreferrer");
    if (destination !== null) destination.opener = null;
    closeDialog();
  }

  const navigationDescription = pendingNavigation === null
    ? getNavigationDescription("", "Continuarás al destino externo")
    : getNavigationDescription(pendingNavigation.url, pendingNavigation.confirmationPurpose);

  return (
    <ExternalNavigationContext.Provider value={{ requestNavigation: (url, invoker, confirmationPurpose) => setPendingNavigation({ ...(confirmationPurpose === undefined ? {} : { confirmationPurpose }), invoker, url }) }}>
      {children}
      {isMounted ? createPortal(
        <dialog aria-describedby="external-navigation-description" aria-labelledby="external-navigation-title" aria-modal="true" className="external-navigation-dialog" onCancel={(event) => { event.preventDefault(); closeDialog(); }} onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            closeDialog();
            return;
          }

          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            if (event.key === "ArrowRight") continueRef.current?.focus({ preventScroll: true });
            else cancelRef.current?.focus({ preventScroll: true });
            return;
          }

          if (event.key !== "Tab") return;
          const focusableElements = getFocusableElements(event.currentTarget);
          const firstElement = focusableElements[0];
          const lastElement = focusableElements.at(-1);
          if (firstElement === undefined || lastElement === undefined) return;
          if (event.shiftKey && document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          } else if (!event.shiftKey && document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }} ref={dialogRef}>
          <div className="external-navigation-dialog-shell">
            <div className="external-navigation-dialog-content">
              <h2 id="external-navigation-title">Vas a salir del portafolio</h2>
              <p aria-label={navigationDescription.accessibleText} className="external-navigation-description" id="external-navigation-description">
                <span className="external-navigation-description-purpose">{navigationDescription.purpose}</span>
                <span className="external-navigation-description-note">{navigationDescription.note}</span>
              </p>
            </div>
            <div className="external-navigation-actions">
              <button onClick={closeDialog} ref={cancelRef} type="button">Cancelar</button>
              <button onClick={continueNavigation} ref={continueRef} type="button">Continuar</button>
            </div>
          </div>
        </dialog>,
        document.body,
      ) : null}
    </ExternalNavigationContext.Provider>
  );
}

export function ExternalLink({ children, className, confirmationPurpose, href, ref }: ExternalLinkProps) {
  const context = useContext(ExternalNavigationContext);

  function requestNavigation(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    if (context !== null) context.requestNavigation(href, event.currentTarget, confirmationPurpose);
  }

  return <a className={className} href={href} onAuxClick={requestNavigation} onClick={requestNavigation} onKeyDown={(event) => handleSpaceActivation(event, () => event.currentTarget.click())} ref={ref} rel="noopener noreferrer" target="_blank">{children}</a>;
}
