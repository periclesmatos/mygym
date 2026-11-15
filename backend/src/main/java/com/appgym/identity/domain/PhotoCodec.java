package com.appgym.identity.domain;

import com.appgym.shared.error.BadRequestException;
import java.util.Base64;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Converte a foto entre data URL (o que a API troca com o front) e bytes (o que fica no banco). */
public final class PhotoCodec {
    public static final int MAX_BYTES = 512 * 1024;
    private static final Set<String> TYPES = Set.of("image/jpeg", "image/png", "image/webp");
    private static final Pattern DATA_URL = Pattern.compile("^data:([a-z/+-]+);base64,(.+)$", Pattern.DOTALL);

    private PhotoCodec() {}

    public record Decoded(String contentType, byte[] data) {}

    public static Decoded decode(String dataUrl) {
        Matcher matcher = DATA_URL.matcher(dataUrl == null ? "" : dataUrl);
        if (!matcher.matches() || !TYPES.contains(matcher.group(1))) {
            throw new BadRequestException("Envie uma imagem JPG, PNG ou WebP.");
        }
        byte[] bytes;
        try {
            bytes = Base64.getDecoder().decode(matcher.group(2));
        } catch (IllegalArgumentException exception) {
            throw new BadRequestException("Não foi possível ler a imagem.");
        }
        if (bytes.length == 0) throw new BadRequestException("Não foi possível ler a imagem.");
        if (bytes.length > MAX_BYTES) throw new BadRequestException("A foto pode ter até 512 KB.");
        return new Decoded(matcher.group(1), bytes);
    }

    public static String encode(UserPhoto photo) {
        return "data:" + photo.getContentType() + ";base64,"
                + Base64.getEncoder().encodeToString(photo.getData());
    }
}
