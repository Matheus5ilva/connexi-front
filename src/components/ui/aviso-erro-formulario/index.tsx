import { FaExclamationTriangle } from "react-icons/fa";
import type { ErroFormularioAmigavel } from "../../../services/api/errors/erro-formulario";

type AvisoErroFormularioProps = {
  mensagem?: string;
  titulo?: string;
  erros?: ErroFormularioAmigavel[];
};

export function AvisoErroFormulario({
  mensagem,
  titulo = "Verifique os campos abaixo:",
  erros = [],
}: AvisoErroFormularioProps) {
  const deveMostrarLista = erros.length > 0;

  return (
    <div
      className="alert alert-danger d-flex gap-3 align-items-start mb-0"
      role="alert"
    >
      <FaExclamationTriangle className="mt-1 flex-shrink-0" aria-hidden="true" />

      <div className="flex-grow-1">
        <strong className="d-block mb-2">{titulo}</strong>

        {mensagem ? <p className="mb-0">{mensagem}</p> : null}

        {deveMostrarLista ? (
          <ul className={`mb-0 ${mensagem ? "mt-2" : ""}`}>
            {erros.map((erro) => (
              <li key={`${erro.campo}-${erro.mensagem}`}>
                <strong>{erro.campo}:</strong> {erro.mensagem}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
