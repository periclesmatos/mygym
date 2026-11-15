/** Mesma regra do backend (RegisterRequest / ChangePasswordRequest). */
export const MIN_PASSWORD_LENGTH = 6

/** Mensagem de erro, ou '' se a senha serve. */
export function passwordError(password, label = 'A senha') {
  return password.length < MIN_PASSWORD_LENGTH
    ? `${label} precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`
    : ''
}
