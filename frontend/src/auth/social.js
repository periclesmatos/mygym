// Scripts oficiais do Google Identity Services e do Sign in with Apple JS, carregados só quando usados.
const GOOGLE_SRC = 'https://accounts.google.com/gsi/client'
const APPLE_SRC = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/pt_BR/appleid.auth.js'

const loading = new Map()

function loadScript(src) {
  if (!loading.has(src)) {
    loading.set(src, new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = src
      script.async = true
      script.onload = resolve
      script.onerror = () => {
        loading.delete(src)
        reject(new Error('Não foi possível carregar o login. Confira a internet.'))
      }
      document.head.appendChild(script)
    }))
  }
  return loading.get(src)
}

/** Desenha o botão do Google em `element`; `onCredential` recebe o ID token (JWT). */
export async function renderGoogleButton(element, clientId, onCredential) {
  await loadScript(GOOGLE_SRC)
  const google = window.google
  google.accounts.id.initialize({
    client_id: clientId,
    callback: (response) => onCredential(response.credential),
    ux_mode: 'popup'
  })
  const dark = document.documentElement.dataset.theme !== 'light'
  google.accounts.id.renderButton(element, {
    type: 'standard',
    theme: dark ? 'filled_black' : 'outline',
    size: 'large',
    shape: 'pill',
    text: 'continue_with',
    locale: 'pt-BR',
    width: Math.min(400, Math.max(200, Math.round(element.clientWidth || 320)))
  })
}

/** Abre o popup da Apple. Devolve { idToken, name } ou null se a pessoa fechar o popup. */
export async function signInWithApple({ clientId, redirectUri }) {
  await loadScript(APPLE_SRC)
  window.AppleID.auth.init({ clientId, scope: 'name email', redirectURI: redirectUri, usePopup: true })
  try {
    const data = await window.AppleID.auth.signIn()
    const first = data.user?.name?.firstName || ''
    const last = data.user?.name?.lastName || ''
    return { idToken: data.authorization.id_token, name: `${first} ${last}`.trim() || null }
  } catch (error) {
    if (error?.error === 'popup_closed_by_user' || error?.error === 'user_cancelled_authorize') return null
    throw new Error('Não foi possível entrar com a Apple. Tente de novo.')
  }
}
