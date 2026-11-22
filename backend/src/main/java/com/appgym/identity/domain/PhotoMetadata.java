package com.appgym.identity.domain;

import java.io.ByteArrayOutputStream;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;
import java.util.Optional;
import java.util.Set;

/**
 * Tira EXIF, GPS e outros metadados antes de mostrar a foto a outra pessoa, sem recodificar. O que
 * não for do formato que diz ser não é mostrado.
 */
public final class PhotoMetadata {
    private static final Set<String> PNG_KEEP = Set.of("IHDR", "PLTE", "tRNS", "IDAT", "IEND");
    private static final Set<String> WEBP_KEEP = Set.of("VP8 ", "VP8L", "VP8X", "ALPH");
    private static final byte[] PNG = {(byte) 0x89, 'P', 'N', 'G', '\r', '\n', 0x1A, '\n'};

    private PhotoMetadata() {}

    public static Optional<byte[]> strip(String contentType, byte[] data) {
        return switch (contentType) {
            case "image/jpeg" -> jpeg(data);
            case "image/png" -> png(data);
            case "image/webp" -> webp(data);
            default -> Optional.empty();
        };
    }

    private static Optional<byte[]> jpeg(byte[] data) {
        if (data.length < 4 || data[0] != (byte) 0xFF || data[1] != (byte) 0xD8) return Optional.empty();
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        out.write(data, 0, 2);
        int at = 2;
        boolean scanned = false;
        while (at + 1 < data.length) {
            if (data[at] != (byte) 0xFF) return Optional.empty();
            int marker = data[at + 1] & 0xFF;
            if (marker == 0xFF) {
                at++;
                continue;
            }
            if (marker == 0xD9) {
                if (!scanned) return Optional.empty();
                out.write(data, at, 2);
                return Optional.of(out.toByteArray());
            }
            if (at + 4 > data.length) return Optional.empty();
            int end = at + 2 + (((data[at + 2] & 0xFF) << 8) | (data[at + 3] & 0xFF));
            if (end < at + 4 || end > data.length) return Optional.empty();
            // APPn e comentário saem; o APP14 fica porque muda como as cores são lidas.
            boolean metadata = (marker >= 0xE0 && marker <= 0xEF && marker != 0xEE) || marker == 0xFE;
            if (!metadata) out.write(data, at, end - at);
            at = end;
            if (marker == 0xDA) {
                scanned = true;
                // Dentro da imagem, FF só aparece seguido de 00 ou de um reinício (D0 a D7).
                int start = at;
                while (at + 1 < data.length) {
                    int next = data[at + 1] & 0xFF;
                    if (data[at] == (byte) 0xFF && next != 0 && (next < 0xD0 || next > 0xD7)) break;
                    at++;
                }
                out.write(data, start, at - start);
            }
        }
        return Optional.empty();
    }

    private static Optional<byte[]> png(byte[] data) {
        if (data.length < PNG.length) return Optional.empty();
        for (int i = 0; i < PNG.length; i++) if (data[i] != PNG[i]) return Optional.empty();
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        out.write(data, 0, PNG.length);
        int at = PNG.length;
        while (at + 12 <= data.length) {
            int length = ByteBuffer.wrap(data, at, 4).getInt();
            if (length < 0 || length > data.length - at - 12) return Optional.empty();
            String type = new String(data, at + 4, 4, StandardCharsets.ISO_8859_1);
            if (PNG_KEEP.contains(type)) out.write(data, at, length + 12);
            if (type.equals("IEND")) return Optional.of(out.toByteArray());
            at += length + 12;
        }
        return Optional.empty();
    }

    private static Optional<byte[]> webp(byte[] data) {
        if (data.length < 20
                || !new String(data, 0, 4, StandardCharsets.ISO_8859_1).equals("RIFF")
                || !new String(data, 8, 4, StandardCharsets.ISO_8859_1).equals("WEBP")) return Optional.empty();
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        out.write(data, 0, 12);
        int at = 12;
        while (at + 8 <= data.length) {
            int length = ByteBuffer.wrap(data, at + 4, 4)
                    .order(ByteOrder.LITTLE_ENDIAN)
                    .getInt();
            if (length < 0 || length > data.length - at - 8) return Optional.empty();
            int size = 8 + length + (length % 2);
            if (size > data.length - at) return Optional.empty();
            String type = new String(data, at, 4, StandardCharsets.ISO_8859_1);
            if (WEBP_KEEP.contains(type)) {
                byte[] chunk = new byte[size];
                System.arraycopy(data, at, chunk, 0, size);
                // Desliga os avisos de perfil de cor, EXIF, XMP e animação, que saíram.
                if (type.equals("VP8X") && length > 0) chunk[8] &= 0x10;
                out.write(chunk, 0, size);
            }
            at += size;
        }
        if (at != data.length || out.size() == 12) return Optional.empty();
        byte[] result = out.toByteArray();
        ByteBuffer.wrap(result).order(ByteOrder.LITTLE_ENDIAN).putInt(4, result.length - 8);
        return Optional.of(result);
    }
}
