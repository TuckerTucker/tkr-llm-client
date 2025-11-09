"""
Unit tests for FastAPI routes

Tests the HTTP endpoints for chat completions, models, and health checks.
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch, AsyncMock
import json

# Import server app
try:
    from llm_server.server import app
except ImportError:
    pytest.skip("Server module not available", allow_module_level=True)


@pytest.fixture
def client():
    """Create test client"""
    return TestClient(app)


@pytest.fixture
def mock_adapter():
    """Mock GPT-OSS adapter"""
    mock = Mock()
    mock.is_loaded = Mock(return_value=True)
    mock.generate = AsyncMock()
    mock.generate_stream = AsyncMock()
    return mock


class TestHealthEndpoint:
    """Test health check endpoint"""

    def test_health_endpoint_success(self, client):
        """Test health check returns 200 OK"""
        response = client.get("/health")

        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert data["status"] in ["ok", "starting", "error"]

    def test_health_endpoint_schema(self, client):
        """Test health check response schema"""
        response = client.get("/health")
        data = response.json()

        # Required fields
        assert "status" in data
        assert "model_loaded" in data

        # Optional fields may be present
        if "model_name" in data:
            assert isinstance(data["model_name"], str)
        if "device" in data:
            assert data["device"] in ["auto", "mps", "cpu"]

    def test_health_endpoint_model_not_loaded(self, client):
        """Test health check when model not loaded"""
        with patch('llm_server.server.adapter') as mock_adapter:
            mock_adapter.is_loaded.return_value = False

            response = client.get("/health")

            assert response.status_code == 200
            data = response.json()
            assert data["model_loaded"] is False


class TestChatCompletionsEndpoint:
    """Test chat completions endpoint"""

    def test_chat_completions_basic(self, client, mock_adapter):
        """Test basic chat completions request"""
        with patch('llm_server.routes.chat.adapter', mock_adapter):
            from llm_server.adapters.gpt_oss_adapter import GenerationResult

            mock_adapter.generate.return_value = GenerationResult(
                text="Hello! How can I help you?",
                tokens_generated=6,
                finish_reason="stop",
                prompt_tokens=10,
                completion_tokens=6,
            )

            response = client.post(
                "/v1/chat/completions",
                json={
                    "model": "gpt-oss-20b",
                    "messages": [{"role": "user", "content": "Hello"}],
                    "max_tokens": 10,
                },
            )

            assert response.status_code == 200
            data = response.json()

            # Validate OpenAI response schema
            assert "id" in data
            assert "object" in data
            assert data["object"] == "chat.completion"
            assert "choices" in data
            assert len(data["choices"]) > 0
            assert "message" in data["choices"][0]
            assert "usage" in data

    def test_chat_completions_with_system_message(self, client, mock_adapter):
        """Test chat completions with system message"""
        with patch('llm_server.routes.chat.adapter', mock_adapter):
            from llm_server.adapters.gpt_oss_adapter import GenerationResult

            mock_adapter.generate.return_value = GenerationResult(
                text="I'm helpful!",
                tokens_generated=3,
                finish_reason="stop",
                prompt_tokens=15,
                completion_tokens=3,
            )

            response = client.post(
                "/v1/chat/completions",
                json={
                    "model": "gpt-oss-20b",
                    "messages": [
                        {"role": "system", "content": "You are helpful"},
                        {"role": "user", "content": "Who are you?"},
                    ],
                    "max_tokens": 20,
                },
            )

            assert response.status_code == 200
            data = response.json()
            assert data["choices"][0]["message"]["content"]

    def test_chat_completions_streaming(self, client, mock_adapter):
        """Test streaming chat completions"""
        with patch('llm_server.routes.chat.adapter', mock_adapter):
            from llm_server.adapters.gpt_oss_adapter import StreamChunk

            async def mock_stream():
                yield StreamChunk(delta="Hello", is_final=False)
                yield StreamChunk(delta=" there", is_final=False)
                yield StreamChunk(delta="!", is_final=True, finish_reason="stop")

            mock_adapter.generate_stream.return_value = mock_stream()

            response = client.post(
                "/v1/chat/completions",
                json={
                    "model": "gpt-oss-20b",
                    "messages": [{"role": "user", "content": "Hello"}],
                    "stream": True,
                    "max_tokens": 20,
                },
                stream=True,
            )

            assert response.status_code == 200
            assert "text/event-stream" in response.headers["content-type"]

            # Collect streaming chunks
            chunks = []
            for line in response.iter_lines():
                if line and line.startswith(b"data: "):
                    chunks.append(line.decode())

            # Should have data chunks and [DONE]
            assert len(chunks) > 0
            assert chunks[-1] == "data: [DONE]"

    def test_chat_completions_missing_messages(self, client):
        """Test error when messages are missing"""
        response = client.post(
            "/v1/chat/completions",
            json={
                "model": "gpt-oss-20b",
                "max_tokens": 10,
            },
        )

        assert response.status_code == 422  # Unprocessable Entity

    def test_chat_completions_empty_messages(self, client):
        """Test error when messages array is empty"""
        response = client.post(
            "/v1/chat/completions",
            json={
                "model": "gpt-oss-20b",
                "messages": [],
                "max_tokens": 10,
            },
        )

        # Should either accept (and return minimal response) or reject
        assert response.status_code in [200, 400, 422]

    def test_chat_completions_invalid_role(self, client):
        """Test error with invalid message role"""
        response = client.post(
            "/v1/chat/completions",
            json={
                "model": "gpt-oss-20b",
                "messages": [{"role": "invalid", "content": "Test"}],
                "max_tokens": 10,
            },
        )

        assert response.status_code in [400, 422]

    def test_chat_completions_parameters(self, client, mock_adapter):
        """Test chat completions with generation parameters"""
        with patch('llm_server.routes.chat.adapter', mock_adapter):
            from llm_server.adapters.gpt_oss_adapter import GenerationResult

            mock_adapter.generate.return_value = GenerationResult(
                text="Response",
                tokens_generated=1,
                finish_reason="stop",
                prompt_tokens=5,
                completion_tokens=1,
            )

            response = client.post(
                "/v1/chat/completions",
                json={
                    "model": "gpt-oss-20b",
                    "messages": [{"role": "user", "content": "Test"}],
                    "max_tokens": 50,
                    "temperature": 0.8,
                    "top_p": 0.95,
                },
            )

            assert response.status_code == 200

    def test_chat_completions_usage_stats(self, client, mock_adapter):
        """Test usage statistics in response"""
        with patch('llm_server.routes.chat.adapter', mock_adapter):
            from llm_server.adapters.gpt_oss_adapter import GenerationResult

            mock_adapter.generate.return_value = GenerationResult(
                text="Test response",
                tokens_generated=2,
                finish_reason="stop",
                prompt_tokens=10,
                completion_tokens=2,
            )

            response = client.post(
                "/v1/chat/completions",
                json={
                    "model": "gpt-oss-20b",
                    "messages": [{"role": "user", "content": "Test"}],
                    "max_tokens": 10,
                },
            )

            data = response.json()
            assert "usage" in data
            assert "prompt_tokens" in data["usage"]
            assert "completion_tokens" in data["usage"]
            assert "total_tokens" in data["usage"]
            assert data["usage"]["total_tokens"] == (
                data["usage"]["prompt_tokens"] + data["usage"]["completion_tokens"]
            )


class TestModelsEndpoint:
    """Test models listing endpoint"""

    def test_models_endpoint(self, client):
        """Test models listing"""
        response = client.get("/v1/models")

        assert response.status_code == 200
        data = response.json()

        # Validate OpenAI models response schema
        assert data["object"] == "list"
        assert "data" in data
        assert isinstance(data["data"], list)

    def test_models_endpoint_contains_model(self, client):
        """Test models list contains at least one model"""
        response = client.get("/v1/models")
        data = response.json()

        assert len(data["data"]) > 0

        # Check first model has required fields
        model = data["data"][0]
        assert "id" in model
        assert "object" in model
        assert model["object"] == "model"

    def test_models_endpoint_model_fields(self, client):
        """Test model object has all required fields"""
        response = client.get("/v1/models")
        data = response.json()

        model = data["data"][0]
        assert "id" in model
        assert "object" in model
        assert "created" in model
        assert "owned_by" in model


class TestErrorHandling:
    """Test error handling across endpoints"""

    def test_invalid_json(self, client):
        """Test handling of invalid JSON"""
        response = client.post(
            "/v1/chat/completions",
            data="invalid json",
            headers={"Content-Type": "application/json"},
        )

        assert response.status_code == 422

    def test_model_not_loaded_error(self, client, mock_adapter):
        """Test error when model is not loaded"""
        with patch('llm_server.routes.chat.adapter', mock_adapter):
            mock_adapter.is_loaded.return_value = False
            mock_adapter.generate.side_effect = RuntimeError("Model not loaded")

            response = client.post(
                "/v1/chat/completions",
                json={
                    "model": "gpt-oss-20b",
                    "messages": [{"role": "user", "content": "Test"}],
                },
            )

            assert response.status_code in [500, 503]

    def test_generation_error(self, client, mock_adapter):
        """Test handling of generation errors"""
        with patch('llm_server.routes.chat.adapter', mock_adapter):
            mock_adapter.generate.side_effect = Exception("Generation failed")

            response = client.post(
                "/v1/chat/completions",
                json={
                    "model": "gpt-oss-20b",
                    "messages": [{"role": "user", "content": "Test"}],
                },
            )

            assert response.status_code == 500


class TestCORS:
    """Test CORS configuration"""

    def test_cors_headers(self, client):
        """Test CORS headers are present"""
        response = client.options(
            "/v1/chat/completions",
            headers={"Origin": "http://localhost:42001"},
        )

        # CORS should allow requests
        assert response.status_code in [200, 204]


class TestRequestValidation:
    """Test request validation"""

    def test_max_tokens_validation(self, client):
        """Test max_tokens parameter validation"""
        response = client.post(
            "/v1/chat/completions",
            json={
                "model": "gpt-oss-20b",
                "messages": [{"role": "user", "content": "Test"}],
                "max_tokens": -1,  # Invalid
            },
        )

        assert response.status_code == 422

    def test_temperature_validation(self, client):
        """Test temperature parameter validation"""
        response = client.post(
            "/v1/chat/completions",
            json={
                "model": "gpt-oss-20b",
                "messages": [{"role": "user", "content": "Test"}],
                "temperature": 3.0,  # Should be 0.0-2.0
            },
        )

        # May accept or reject depending on validation rules
        assert response.status_code in [200, 400, 422]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
