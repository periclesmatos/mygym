package com.appgym.identity;

import java.util.UUID;

/**
 * O que outra pessoa pode saber de um usuário. Nunca entram e-mail, telefone, nascimento ou medidas.
 *
 * @param id só para uso entre módulos: para fora sai o {@code publicId}
 * @param name o nome, ou o @username de quem não pôs nome
 */
public record PublicUser(Long id, UUID publicId, String name, String username, boolean hasPhoto) {}
